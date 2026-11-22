from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import CourseViewSet,StatsView, ModuleViewSet, TaskViewSet, TestCaseViewSet, Submissions

router = DefaultRouter()
router.register('courses', CourseViewSet)
router.register('modules', ModuleViewSet)
router.register('tasks', TaskViewSet)
router.register('test-cases', TestCaseViewSet)

urlpatterns = router.urls + [
     path('submissions/', Submissions.as_view()),
     path('stats/', StatsView.as_view()),
]