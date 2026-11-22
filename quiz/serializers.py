from rest_framework import serializers
from .models import *
from account.serializers import RegisterSerializer



class CourseSerializer(serializers.ModelSerializer):
    modules=serializers.SerializerMethodField()
    class Meta:
        model=Course
        fields=('id','title', 'description','modules')
    def get_modules(self, obj):
        return ModuleSerializer(obj.modules.all(), many=True,context=self.context).data
    
    
    

class ModuleSerializer(serializers.ModelSerializer):
    tasks=serializers.SerializerMethodField()
    class Meta:
        model=Module
        fields=('id','title','course','tasks')
    def get_tasks(self, obj):
        return TaskSerializer(obj.tasks.all(),many=True,context=self.context).data


class TaskSerializer(serializers.ModelSerializer):
 
    is_solved_by_me=serializers.SerializerMethodField()
    class Meta:
        model=Task
        fields=('id','title','description','module','is_solved_by_me')
    def get_is_solved_by_me(self,obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Submission.objects.filter(task=obj,user=request.user,status='accepted').exists()
        return False
    

class TestCaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestCase
        fields = ('id', 'task', 'input_data', 'expected_output')


class SubmissionSerializer(serializers.ModelSerializer):
    user = RegisterSerializer(read_only=True)
    task_id = serializers.PrimaryKeyRelatedField(
        source='task',
        queryset=Task.objects.all(),
    )
    code = serializers.CharField(max_length=20000, trim_whitespace=False)

    class Meta:
        model = Submission
        fields = ('id', 'user', 'task_id', 'code', 'status')
        read_only_fields = ('status',)