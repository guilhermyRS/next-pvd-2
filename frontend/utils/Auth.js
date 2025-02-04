class Auth {
  static isAuthenticated() {
      if (typeof window === 'undefined') return false;
      return localStorage.getItem('token') !== null;
  }

  static getUser() {
      if (typeof window === 'undefined') return null;
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
  }

  static isAdmin() {
      const user = this.getUser();
      return user?.role === 'admin';
  }

  static login(token, user) {
      if (typeof window === 'undefined') return;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
  }

  static logout() {
      if (typeof window === 'undefined') return;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
  }

  static updateUser(userData) {
      if (typeof window === 'undefined') return;
      const currentUser = this.getUser();
      const updatedUser = { ...currentUser, ...userData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
  }
}

export default Auth;