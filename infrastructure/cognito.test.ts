import { describe, it, expect } from 'vitest';
import {
  mesahomesUserPoolDefinition,
  mesahomesAppClientDefinition,
  USER_POOL_NAME,
  APP_CLIENT_NAME,
} from './cognito.js';

describe('Cognito User Pool definition', () => {
  it('should use the correct user pool name', () => {
    expect(USER_POOL_NAME).toBe('mesahomes-userpool');
    expect(mesahomesUserPoolDefinition.PoolName).toBe('mesahomes-userpool');
  });

  it('should use email as the username attribute', () => {
    expect(mesahomesUserPoolDefinition.UsernameAttributes).toEqual(['email']);
  });

  it('should auto-verify email', () => {
    expect(mesahomesUserPoolDefinition.AutoVerifiedAttributes).toEqual(['email']);
  });

  it('should enforce password policy: min 8 chars, uppercase, lowercase, number, symbol', () => {
    const policy = mesahomesUserPoolDefinition.Policies?.PasswordPolicy;
    expect(policy).toBeDefined();
    expect(policy!.MinimumLength).toBe(8);
    expect(policy!.RequireUppercase).toBe(true);
    expect(policy!.RequireLowercase).toBe(true);
    expect(policy!.RequireNumbers).toBe(true);
    expect(policy!.RequireSymbols).toBe(true);
  });

  it('should define custom:role attribute as mutable String', () => {
    const schema = mesahomesUserPoolDefinition.Schema!;
    const roleAttr = schema.find((s) => s.Name === 'role');
    expect(roleAttr).toBeDefined();
    expect(roleAttr!.AttributeDataType).toBe('String');
    expect(roleAttr!.Mutable).toBe(true);
  });

  it('should define custom:teamId attribute as mutable String', () => {
    const schema = mesahomesUserPoolDefinition.Schema!;
    const teamIdAttr = schema.find((s) => s.Name === 'teamId');
    expect(teamIdAttr).toBeDefined();
    expect(teamIdAttr!.AttributeDataType).toBe('String');
    expect(teamIdAttr!.Mutable).toBe(true);
  });

  it('should disable self-signup (invite-only)', () => {
    expect(
      mesahomesUserPoolDefinition.AdminCreateUserConfig?.AllowAdminCreateUserOnly,
    ).toBe(true);
  });
});

describe('Cognito App Client definition', () => {
  it('should use the correct client name', () => {
    expect(APP_CLIENT_NAME).toBe('mesahomes-dashboard-client');
    expect(mesahomesAppClientDefinition.ClientName).toBe('mesahomes-dashboard-client');
  });

  it('should not generate a client secret (SPA)', () => {
    expect(mesahomesAppClientDefinition.GenerateSecret).toBe(false);
  });

  it('should allow USER_PASSWORD_AUTH and REFRESH_TOKEN_AUTH flows', () => {
    const flows = mesahomesAppClientDefinition.ExplicitAuthFlows!;
    expect(flows).toContain('ALLOW_USER_PASSWORD_AUTH');
    expect(flows).toContain('ALLOW_REFRESH_TOKEN_AUTH');
  });

  it('should set access token validity to 24 hours', () => {
    expect(mesahomesAppClientDefinition.AccessTokenValidity).toBe(24);
    expect(mesahomesAppClientDefinition.TokenValidityUnits?.AccessToken).toBe('hours');
  });

  it('should set refresh token validity to 30 days', () => {
    expect(mesahomesAppClientDefinition.RefreshTokenValidity).toBe(30);
    expect(mesahomesAppClientDefinition.TokenValidityUnits?.RefreshToken).toBe('days');
  });

  it('should set ID token validity to 24 hours', () => {
    expect(mesahomesAppClientDefinition.IdTokenValidity).toBe(24);
    expect(mesahomesAppClientDefinition.TokenValidityUnits?.IdToken).toBe('hours');
  });
});
