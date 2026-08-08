'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Truck, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

export default function LoginPage() {
  const { login } = useAuth();
  const [fullName, setFullName] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('يرجى إدخال الاسم الكامل');
      return;
    }
    if (!accessCode.trim()) {
      setError('يرجى إدخال الكود');
      return;
    }

    setLoading(true);
    const success = await login(fullName.trim(), accessCode.trim());
    setLoading(false);

    if (!success) {
      setError('الاسم أو الكود غير صحيح');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
      <div className="w-full max-w-md">
        {/* Company Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-500 shadow-lg shadow-amber-500/30 mb-4">
            <Truck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">شركة عباد للنقل</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">نظام التسيير</p>
        </div>

        {/* Login Card */}
        <Card className="border shadow-xl">
          <CardContent className="p-8">
            <h2 className="text-xl font-bold text-center mb-6 text-gray-900 dark:text-white">
              تسجيل الدخول
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="login-name" className="text-sm font-medium">
                  الاسم الكامل
                </Label>
                <Input
                  id="login-name"
                  type="text"
                  placeholder="أدخل اسمك الكامل"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoFocus
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-code" className="text-sm font-medium">
                  الكود
                </Label>
                <Input
                  id="login-code"
                  type="password"
                  placeholder="أدخل الكود"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="h-12 text-base tracking-widest text-center font-mono"
                />
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-center">
                  <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white text-base font-semibold"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-5 h-5 ml-2" />
                    دخول
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-6">
          يجب الحصول على الكود من مسير الشركة للدخول
        </p>
      </div>
    </div>
  );
}
