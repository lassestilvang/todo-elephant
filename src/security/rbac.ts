interface Role {
  permissions: string[];
  actions: string[];
}

export class RBAC {
  private policies = {
    admin: {
      permissions: ['cache:create', 'security:admin'],
      actions: ['createCache', 'updateSecurityPolicy']
    },
    developer: {
      permissions: ['debug:run', 'admin:tools'],
      actions: ['runDebugger', 'accessDevTools']
    },
    user: {
      permissions: ['stats:read', 'export:download'],
      actions: ['viewStats', 'exportData']
    }
  };

hasPermission(userRoles: string[], requiredAction: string): boolean {
    return userRoles.some(role =>
      this.policies[role]?.actions.includes(requiredAction)
    );
  }
}
export const rbac = new RBAC();