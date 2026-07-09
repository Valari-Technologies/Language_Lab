from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken


def blacklist_user_tokens(user):
    """Invalidate all outstanding refresh tokens for a user."""
    for outstanding in OutstandingToken.objects.filter(user_id=user.id):
        BlacklistedToken.objects.get_or_create(token=outstanding)
