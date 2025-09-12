
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Command, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface AuthProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Auth = ({ isOpen, onClose }: AuthProps) => {
  const router = useRouter();
  const { login, register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (isSignUp) {
        await register(email, password);
      } else {
        await login(email, password);
      }
      
      // Close modal and redirect to chat
      onClose();
      router.push('/chat');
    } catch (error) {
      console.error('Authentication error:', error);
      alert(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    // Handle Google sign up
    console.log("Google sign up");
  };

  const handleAppleSignUp = () => {
    // Handle Apple sign up
    console.log("Apple sign up");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Auth Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-md mx-4"
      >
        <div className="relative bg-black/50 backdrop-blur-xl rounded-xl border border-white/10 p-8">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Command className="w-6 h-6 text-primary" />
              <span className="font-bold text-xl">
                Freedom AI<span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"> Analysis</span>
              </span>
            </div>
            <h2 className="text-2xl font-semibold mb-2">
              {isSignUp ? "Создать аккаунт" : "Войти в аккаунт"}
            </h2>
            <p className="text-gray-400 text-sm">
              {isSignUp 
                ? "Начните свой 30-дневный бесплатный период. Отмените в любое время."
                : "Добро пожаловать обратно! Войдите в свой аккаунт."
              }
            </p>
          </div>

          {/* Social Sign Up Buttons */}
          <div className="space-y-3 mb-6">
            <Button
              onClick={handleGoogleSignUp}
              variant="outline"
              className="w-full h-12 bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {isSignUp ? "Зарегистрироваться" : "Войти"} через Google
            </Button>
            
            <Button
              onClick={handleAppleSignUp}
              variant="outline"
              className="w-full h-12 bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              {isSignUp ? "Зарегистрироваться" : "Войти"} через Apple ID
            </Button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <Separator className="bg-white/10" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-black px-3 text-sm text-gray-400">
              ИЛИ
            </span>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email*
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Введите ваш email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20"
                required
              />
            </div>
            
            <div className="space-y-2">
               <Label htmlFor="password" className="text-sm font-medium">
                 Пароль*
               </Label>
               <Input
                 id="password"
                 type="password"
                 placeholder={isSignUp ? "Создайте пароль" : "Введите пароль"}
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 className="h-12 bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20"
                 required
               />
               {isSignUp && (
                 <p className="text-xs text-gray-500">
                   Должен содержать не менее 8 символов.
                 </p>
               )}
             </div>

            <Button
               type="submit"
               disabled={isLoading}
               className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-medium transition-all duration-300"
             >
               {isLoading 
                 ? (isSignUp ? "Создание аккаунта..." : "Вход в систему...") 
                 : (isSignUp ? "Создать аккаунт" : "Войти")
               }
             </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
             <p className="text-sm text-gray-400">
               {isSignUp ? "Уже есть аккаунт?" : "Нет аккаунта?"}{" "}
               <button 
                 onClick={() => setIsSignUp(!isSignUp)}
                 className="text-primary hover:text-primary/80 transition-colors"
               >
                 {isSignUp ? "Войти" : "Зарегистрироваться"}
               </button>
             </p>
           </div>
        </div>


      </motion.div>
    </div>
  );
};