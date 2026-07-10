from rest_framework import serializers
from .models import Scenario, ScenarioBuilder


class ScenarioSerializer(serializers.ModelSerializer):
    grade_name = serializers.CharField(source='grade.grade_name', read_only=True)

    class Meta:
        model = Scenario
        fields = '__all__'


class ScenarioDetailSerializer(serializers.ModelSerializer):
    grade_name = serializers.CharField(source='grade.grade_name', read_only=True)

    class Meta:
        model = Scenario
        fields = '__all__'


class ScenarioBuilderSerializer(serializers.ModelSerializer):
    scenario_title = serializers.CharField(source='scenario.title', read_only=True)

    class Meta:
        model = ScenarioBuilder
        fields = '__all__'


class ScenarioBuilderDetailSerializer(serializers.ModelSerializer):
    scenario_title = serializers.CharField(source='scenario.title', read_only=True)

    class Meta:
        model = ScenarioBuilder
        fields = '__all__'
