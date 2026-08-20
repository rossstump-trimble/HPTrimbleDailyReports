export type HttpWriteMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export function collectionMethodAllowed(method: HttpWriteMethod): boolean {
  switch (method) {
    case 'GET':
    case 'POST':
      return true;
    case 'PUT':
    case 'PATCH':
    case 'DELETE':
      return false;
    default: {
      const _exhaustive: never = method;
      return _exhaustive;
    }
  }
}

export function itemMethodAllowed(method: HttpWriteMethod): boolean {
  switch (method) {
    case 'GET':
      return true;
    case 'POST':
    case 'PUT':
    case 'PATCH':
    case 'DELETE':
      return false;
    default: {
      const _exhaustive: never = method;
      return _exhaustive;
    }
  }
}

export function attachMethodAllowed(method: HttpWriteMethod): boolean {
  switch (method) {
    case 'POST':
    case 'GET':
      return true;
    case 'PUT':
    case 'PATCH':
    case 'DELETE':
      return false;
    default: {
      const _exhaustive: never = method;
      return _exhaustive;
    }
  }
}
