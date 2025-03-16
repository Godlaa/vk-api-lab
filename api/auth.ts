interface AuthServiceType {
  login(email: string, password: string): Promise<object>;
  logout(): void;
}

class AuthService implements AuthServiceType {
  token: string | null = null;

  async login(email: string, password: string): Promise<object> {

    const { encryptedToken } = await fetch('localhost:5000/login') as any;

    localStorage.setItem('apiToken', encryptedToken);

    console.log('Логин успешен, токен зашифрован и сохранён', encryptedToken);

    return Promise.resolve({ apiToken: encryptedToken });
  }

  logout(): void {
    localStorage.removeItem('apiToken');
  }
}

export default AuthService;
