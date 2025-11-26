const testPassword = 'Mukuha123!*';

console.log('Testing password:', testPassword);
console.log('Length:', testPassword.length, '(need 10+)');
console.log('Has uppercase:', /[A-Z]/.test(testPassword));
console.log('Has lowercase:', /[a-z]/.test(testPassword));
console.log('Has number:', /[0-9]/.test(testPassword));
console.log('Has basic symbols:', /[!@#$%^&*(),.?":{}|<>]/.test(testPassword));
console.log('Matches Zod regex:', /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-+=])/.test(testPassword));
