// 🔐 AUTHENTICATION MODULE
const JWT_SECRET = 'your-secret-key-change-in-production';
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

function authLogin(data) {
  const { email, password } = data;
  
  // Get user from database
  const users = getSheetData('👥 Users');
  const user = users.find(u => u.Email === email);
  
  if (!user) {
    auditLog('LOGIN_ATTEMPT', 'User', null, { email }, 'User not found');
    throw new Error('Invalid credentials');
  }
  
  // Simple password check (in production, use proper hashing)
  if (user.PasswordHash !== password) {
    user.FailedAttempts = parseInt(user.FailedAttempts || 0) + 1;
    updateUser(user.UserID, { FailedAttempts: user.FailedAttempts });
    
    auditLog('LOGIN_ATTEMPT', 'User', user.UserID, { email }, 'Invalid password');
    throw new Error('Invalid credentials');
  }
  
  if (user.Status !== 'active') {
    throw new Error('Account is ' + user.Status);
  }
  
  // Reset failed attempts on successful login
  updateUser(user.UserID, { 
    FailedAttempts: 0,
    LastLogin: new Date().toISOString()
  });
  
  // Create JWT token
  const token = createToken({
    userId: user.UserID,
    email: user.Email,
    name: user.Name,
    role: user.Role,
    permissions: user.Permissions ? user.Permissions.split(',') : []
  });
  
  auditLog('LOGIN_SUCCESS', 'User', user.UserID, { email, role: user.Role });
  
  return {
    success: true,
    token,
    user: {
      id: user.UserID,
      email: user.Email,
      name: user.Name,
      role: user.Role,
      permissions: user.Permissions ? user.Permissions.split(',') : [],
      avatar: user.Avatar || 'default'
    }
  };
}

function createToken(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const expiry = new Date(Date.now() + TOKEN_EXPIRY);
  
  const tokenPayload = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(expiry.getTime() / 1000)
  };
  
  // In production, use a proper JWT library
  // This is a simplified version for demo
  const headerEncoded = Utilities.base64Encode(JSON.stringify(header));
  const payloadEncoded = Utilities.base64Encode(JSON.stringify(tokenPayload));
  const signature = Utilities.base64Encode(
    Utilities.computeHmacSha256Signature(
      headerEncoded + '.' + payloadEncoded,
      JWT_SECRET
    )
  );
  
  return headerEncoded + '.' + payloadEncoded + '.' + signature;
}

function validateToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [headerEncoded, payloadEncoded, signature] = parts;
    
    // Verify signature
    const expectedSignature = Utilities.base64Encode(
      Utilities.computeHmacSha256Signature(
        headerEncoded + '.' + payloadEncoded,
        JWT_SECRET
      )
    );
    
    if (signature !== expectedSignature) return null;
    
    const payload = JSON.parse(Utilities.base64Decode(payloadEncoded));
    
    // Check expiry
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return payload;
  } catch (error) {
    return null;
  }
}

function authValidate(data, token) {
  const payload = validateToken(token);
  if (!payload) {
    throw new Error('Invalid token');
  }
  
  return {
    valid: true,
    user: {
      id: payload.userId,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      permissions: payload.permissions
    }
  };
}
