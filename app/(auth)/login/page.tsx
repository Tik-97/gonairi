import { LoginForm } from "@/components/login-form";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function LoginPage() {
  const { dict } = await getDictionary();
  return <LoginForm dict={dict.loginPage} />;
}
