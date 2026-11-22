from django.shortcuts import render
from rest_framework.permissions import BasePermission,IsAdminUser,SAFE_METHODS
from rest_framework.viewsets import ModelViewSet
import subprocess
from rest_framework.exceptions import ValidationError

from drf_yasg.utils import swagger_auto_schema
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.db.models import Avg, Count, Q, Sum 
from django.core.cache import cache


from .models import Course,Module,Task, TestCase,Submission

from .serializers import CourseSerializer,ModuleSerializer,TaskSerializer,TestCaseSerializer,SubmissionSerializer


class AdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if request.method in SAFE_METHODS:
            return True
        
        return request.user.is_staff
    
    
class CourseViewSet(ModelViewSet):
    queryset = Course.objects.prefetch_related('modules__tasks').order_by('id')
    serializer_class = CourseSerializer
    permission_classes = [AdminOrReadOnly]
    search_fields =['title']
    ordering_fields = ['id','title']
   
   
    def get_queryset(self):
       queryset = super().get_queryset()
       title = self.request.GET.get('title')
       
       if self.action == 'list' and title:
           queryset = queryset.filter(title=title)
       
       
       return queryset
 
 
 
 
    
class ModuleViewSet(ModelViewSet):
    queryset = Module.objects.select_related('course').prefetch_related('tasks').order_by('id') 
    serializer_class = ModuleSerializer
    permission_classes = [AdminOrReadOnly]    
    search_fields =['title']
    ordering_fields = ['id','title']
    
    def list(self, request, *args, **kwargs):
        cache_key = "products_list"
        data = cache.get(cache_key)

        if not data:
            serializer = self.get_serializer(self.get_queryset(), many=True)
            data = serializer.data
            cache.set(cache_key, data, 60)  # 60 секунд

        return Response(data)

    def retrieve(self, request, *args, **kwargs):
        pk = kwargs.get("pk")
        cache_key = f"product_{pk}"
        data = cache.get(cache_key)

        if not data:
            product = self.get_object()
            data = ProductSerializer(product).data
            cache.set(cache_key, data, 60)

        return Response(data)

    def perform_create(self, serializer):
        serializer.save()
        cache.clear()

    def perform_update(self, serializer):
        serializer.save()
        cache.clear()

    def perform_destroy(self, instance):
        instance.delete()
        cache.clear()
    
    def get_queryset(self):
        queryset = super().get_queryset()
        course = self.request.GET.get('course')

        if self.action == 'list' and course:
            try:
                queryset = queryset.filter(course_id=int(course))
            except ValueError:
                raise ValidationError({'course': 'Укажи ID курса числом.'})

        return queryset      

class TaskViewSet(ModelViewSet):
    queryset = Task.objects.select_related('module').order_by('id')
    serializer_class = TaskSerializer
    permission_classes = [AdminOrReadOnly]
    search_fields =['title']
    ordering_fields = ['id','title']    
    
    def get_queryset(self):
        queryset = super().get_queryset()
        module = self.request.GET.get('module')

        if self.action == 'list' and module:
            try:
                queryset = queryset.filter(module_id=int(module))
            except ValueError:
                raise ValidationError({'module': 'Укажи ID модуля числом.'})

        return queryset    
    
class TestCaseViewSet(ModelViewSet):
    queryset = TestCase.objects.all().order_by('id')
    serializer_class = TestCaseSerializer
    permission_classes = [IsAdminUser]
    
    
    
class Submissions(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if request.user.is_staff:
            submissions = Submission.objects.all()
        else:
            submissions = Submission.objects.filter(user = request.user)
        
        selializer = SubmissionSerializer(submissions,many = True)
        return Response(selializer.data)
    
    @swagger_auto_schema(
        request_body=SubmissionSerializer,
        responses={201: SubmissionSerializer, 400: 'Validation error'},
    )
    def post(self, request):
        serializer = SubmissionSerializer(data = request.data)
        serializer.is_valid(raise_exception=True)
        
        
        task = serializer.validated_data['task']
        test_cases = list(TestCase.objects.filter(task=task))
        
        
        submission = serializer.save(user = request.user, status ='error',)
        
        
        if test_cases:
            submission.status = 'accepted'
        for test in test_cases:
            try:
                
                result = subprocess.run(
                ["python", "-c", submission.code],
                input=test.input_data,
                text=True,
                capture_output=True,
                timeout=2,
)
            except subprocess.TimeoutExpired:
                submission.status = 'time_limit'
                break

            if result.returncode != 0:
                submission.status = 'error'
                break

            a = result.stdout.strip()
            b = test.expected_output.strip()

            if a != b:
                submission.status = 'wrong_answer'
                break

        submission.save(update_fields=['status'])
        return Response(serializer.data, status=201)
                
class StatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        cache_key = "stats_list"
        data = cache.get(cache_key)
        if not data:    
            users = get_user_model().objects.annotate(
                submissions_count=Count('submissions'),
                accepted_count=Count(
                    'submissions',
                    filter=Q(submissions__status='accepted'),
                ),
            )
            user_rows = users.values(
                'id', 'username', 'submissions_count', 'accepted_count',
            )

            courses = Course.objects.annotate(
                tasks_count=Count('modules__tasks', distinct=True),
                submissions_count=Count('modules__tasks__submissions'),
            ).values('id', 'title', 'tasks_count', 'submissions_count')

            hardest_tasks = Task.objects.annotate(
                failed_count=Count(
                    'submissions',
                    filter=~Q(submissions__status='accepted'),
                ),
            ).filter(failed_count__gt=0).values('id', 'title', 'failed_count')

            overall = users.aggregate(
                submissions=Sum('submissions_count', default=0),
                accepted=Sum('accepted_count', default=0),
                average_submissions=Avg('submissions_count', default=0),
            )
            overall['users'] = users.count()
            overall['courses'] = Course.objects.count()
            overall['tasks'] = Task.objects.count()
            cache.set(cache_key, data, 60)
            return Response({
                'overall': overall,
                'per_user': list(user_rows.order_by('id')),
                'per_course': list(courses.order_by('id')),
                'top_users': list(user_rows.order_by('-accepted_count', 'id')[:10]),
                'popular_courses': list(courses.order_by('-submissions_count', 'id')[:5]),
                'hardest_tasks': list(hardest_tasks.order_by('-failed_count', 'id')[:10]),
            })
        return Response(data)