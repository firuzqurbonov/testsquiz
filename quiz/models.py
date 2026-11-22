from django.conf import settings
from django.db import models


class Course(models.Model):
    title = models.CharField(max_length=150)
    description = models.TextField(blank=True)


class Module(models.Model):
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name='modules',
    )
    title = models.CharField(max_length=150)


class Task(models.Model):
    module = models.ForeignKey(
        Module, on_delete=models.CASCADE, related_name='tasks',
    )
    title = models.CharField(max_length=150)
    description = models.TextField()


class TestCase(models.Model):
    task = models.ForeignKey(
        Task, on_delete=models.CASCADE, related_name='test_cases',
    )
    input_data = models.TextField(blank=True)
    expected_output = models.TextField(blank=True)


class Submission(models.Model):
    class Status(models.TextChoices):
        ACCEPTED = 'accepted'
        WRONG_ANSWER = 'wrong_answer'
        ERROR = 'error'
        TIME_LIMIT = 'time_limit'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='submissions',
    )
    task = models.ForeignKey(
        Task, on_delete=models.CASCADE, related_name='submissions',
    )
    code = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices)
    created_at = models.DateTimeField(auto_now_add=True)