import LoginForm from '@/app/ui/login-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Đăng nhập - Quản Lý Công Việc',
};

export default function LoginPage() {
    return <LoginForm />;
}
