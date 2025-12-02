class ServiceError(Exception):
    def __init__(self, detail: str):
        self.detail = detail
        super().__init__(detail)

class NotFoundError(ServiceError):
    pass

class PermissionDeniedError(ServiceError):
    pass

class ValidationError(ServiceError):
    pass

class ConflictError(ServiceError):
    pass