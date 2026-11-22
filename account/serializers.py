from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers


from .models import Profile


User = get_user_model()



class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'password')
        extra_kwargs = {'password': {'write_only': True}}
        
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
        )
        Profile.objects.create(user=user)
        
        return user


class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source = 'user.username',read_only = True)
    
    class Meta:
        model = Profile
        fields = ('username', 'bio')
        