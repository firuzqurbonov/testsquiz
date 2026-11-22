from django.db import models
from django.contrib.auth.models import AbstractUser


class CustomUser(AbstractUser):
    pass



class Profile(models.Model):
    user = models.OneToOneField(CustomUser,  on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True)