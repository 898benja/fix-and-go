from django.db import connection, DatabaseError
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def health(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1')
            cursor.fetchone()
    except DatabaseError:
        return Response({'status': 'unavailable', 'service': 'fix-and-go-api', 'database': 'unavailable'}, status=503)
    return Response({'status': 'ok', 'service': 'fix-and-go-api', 'database': 'ok'})
