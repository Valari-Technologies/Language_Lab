from rest_framework import serializers


class LMSPackageSerializer(serializers.Serializer):
    """
    Serializer for published package metadata matching Electron LMS specs.
    """
    id = serializers.IntegerField(help_text="PublishVersion ID")
    package_id = serializers.IntegerField(help_text="PublishedPackage ID")
    experience_id = serializers.IntegerField(help_text="Experience/Scenario ID")
    title = serializers.CharField()
    description = serializers.CharField(allow_blank=True, required=False)
    subject = serializers.CharField(allow_blank=True, required=False)
    language = serializers.CharField(allow_blank=True, required=False)
    difficulty = serializers.CharField(allow_blank=True, required=False)
    estimated_duration = serializers.IntegerField(required=False, default=0)
    grade = serializers.CharField(allow_null=True, required=False)
    version = serializers.CharField()
    build_number = serializers.IntegerField()
    package_size = serializers.IntegerField()
    checksum = serializers.CharField(allow_blank=True, allow_null=True, required=False)
    download_url = serializers.CharField()
    published_at = serializers.DateTimeField()


class ClientPackageVersionSerializer(serializers.Serializer):
    experience_id = serializers.IntegerField(required=False)
    package_id = serializers.IntegerField(required=False)
    version = serializers.CharField(required=True)


class LMSPackageUpdateCheckSerializer(serializers.Serializer):
    packages = serializers.ListField(
        child=ClientPackageVersionSerializer(),
        required=True,
        allow_empty=True
    )
