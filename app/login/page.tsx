"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { IconMail, IconLock, IconSchool, IconShieldLock } from '@tabler/icons-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<'admin' | 'student'>('student');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate login delay
    setTimeout(() => {
      setIsLoading(false);
      toast.success(`Welcome back! Logged in as ${role === 'admin' ? 'Admin' : 'Student'}`);
      
      if (role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/student/dashboard');
      }
    }, 1500);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
      <Card className="w-full max-w-md overflow-hidden border-none shadow-xl transition-all duration-500 hover:shadow-2xl">
        <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600" />
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg ring-4 ring-blue-50 dark:ring-blue-900/20">
              <IconSchool size={28} />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Letter System</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <IconMail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@university.ac.id" 
                  className="pl-10" 
                  required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <IconLock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input 
                  id="password" 
                  type="password" 
                  className="pl-10" 
                  required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Sign in as</Label>
              <Select value={role} onValueChange={(v: any) => setRole(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">
                    <div className="flex items-center">
                      <IconSchool className="mr-2 h-4 w-4" />
                      Student
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center">
                      <IconShieldLock className="mr-2 h-4 w-4" />
                      Administrator
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              type="submit" 
              className="mt-2 w-full bg-blue-600 hover:bg-blue-700" 
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 border-t bg-slate-50/50 p-6 dark:bg-slate-900/50">
          <div className="text-center text-xs text-slate-500">
            Forgot your password? <a href="#" className="font-medium text-blue-600 hover:underline">Reset here</a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
