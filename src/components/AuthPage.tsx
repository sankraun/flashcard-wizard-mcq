
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Brain, Mail, Lock, Eye, EyeOff, CheckCircle, Zap, Target, BarChart3, Users, Shield, BookOpen } from 'lucide-react';
import { FadeIn, SlideIn, ScaleIn } from '@/components/ui/micro-interactions';

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    
    if (error) {
      toast({
        title: "Sign In Failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "Successfully signed in"
      });
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password);
    
    if (error) {
      toast({
        title: "Sign Up Failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Check your email!",
        description: "We've sent you a confirmation link"
      });
    }
    setLoading(false);
  };

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Learning",
      description: "Generate smart notes and MCQs from any content using advanced AI technology."
    },
    {
      icon: Target,
      title: "Personalized Study Plans",
      description: "Get customized learning paths based on your goals and performance."
    },
    {
      icon: BarChart3,
      title: "Performance Analytics",
      description: "Track your progress with detailed insights and performance predictions."
    },
    {
      icon: Users,
      title: "Collaborative Learning",
      description: "Study together with peers, share notes, and compete in challenges."
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your data is protected with enterprise-grade security measures."
    },
    {
      icon: BookOpen,
      title: "Comprehensive Content",
      description: "Access a vast library of study materials across multiple subjects."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex">
      {/* Features Section - Left Side */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.05\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <FadeIn delay={200}>
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4 leading-tight">
                Welcome to Neutron AI
              </h1>
              <p className="text-xl text-blue-100 leading-relaxed">
                Your intelligent study companion powered by AI. Transform the way you learn with personalized insights and smart study tools.
              </p>
            </div>
          </FadeIn>

          <div className="space-y-6">
            {features.map((feature, index) => (
              <SlideIn key={index} delay={400 + (index * 100)} direction="right">
                <div className="flex items-start space-x-4 group">
                  <div className="flex-shrink-0 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-all duration-300">
                    <feature.icon className="w-6 h-6 text-blue-200" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                    <p className="text-blue-100 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </SlideIn>
            ))}
          </div>

          <FadeIn delay={1000}>
            <div className="mt-12 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
              <div className="flex items-center space-x-3 mb-3">
                <CheckCircle className="w-5 h-5 text-green-300" />
                <span className="font-medium">Join 10,000+ students</span>
              </div>
              <p className="text-blue-100 text-sm">
                Already using Neutron AI to boost their academic performance and achieve their learning goals.
              </p>
            </div>
          </FadeIn>
        </div>
      </div>

      {/* Auth Section - Right Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-md">
          <ScaleIn delay={300}>
            {/* Mobile Brand Header */}
            <div className="text-center mb-8 lg:hidden">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl mb-4 shadow-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-semibold text-slate-900 mb-2">
                Neutron AI
              </h1>
              <p className="text-sm text-slate-600">
                Your intelligent study companion
              </p>
            </div>

            {/* Auth Card */}
            <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
              <CardHeader className="space-y-1 pb-4">
                <Tabs defaultValue="signin" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-100 p-1 rounded-xl">
                    <TabsTrigger 
                      value="signin" 
                      className="text-sm font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
                    >
                      Sign In
                    </TabsTrigger>
                    <TabsTrigger 
                      value="signup" 
                      className="text-sm font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
                    >
                      Sign Up
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="signin" className="space-y-0">
                    <FadeIn delay={200}>
                      <div className="text-center mb-6">
                        <h2 className="text-2xl font-semibold text-slate-900">Welcome back</h2>
                        <p className="text-sm text-slate-600 mt-1">Sign in to continue your learning journey</p>
                      </div>
                    </FadeIn>
                  </TabsContent>
                  
                  <TabsContent value="signup" className="space-y-0">
                    <FadeIn delay={200}>
                      <div className="text-center mb-6">
                        <h2 className="text-2xl font-semibold text-slate-900">Get started</h2>
                        <p className="text-sm text-slate-600 mt-1">Create your account and start learning</p>
                      </div>
                    </FadeIn>
                  </TabsContent>
                </Tabs>
              </CardHeader>
              
              <CardContent className="pt-0">
                <Tabs defaultValue="signin" className="w-full">
                  <TabsContent value="signin">
                    <form onSubmit={handleSignIn} className="space-y-5">
                      <SlideIn delay={300} direction="up">
                        <div className="space-y-2">
                          <Label htmlFor="signin-email" className="text-sm font-medium text-slate-700">
                            Email address
                          </Label>
                          <div className="relative group">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                            <Input
                              id="signin-email"
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="Enter your email"
                              className="pl-10 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200 hover:border-slate-300"
                              required
                            />
                          </div>
                        </div>
                      </SlideIn>
                      
                      <SlideIn delay={400} direction="up">
                        <div className="space-y-2">
                          <Label htmlFor="signin-password" className="text-sm font-medium text-slate-700">
                            Password
                          </Label>
                          <div className="relative group">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                            <Input
                              id="signin-password"
                              type={showPassword ? "text" : "password"}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Enter your password"
                              className="pl-10 pr-10 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200 hover:border-slate-300"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </SlideIn>
                      
                      <SlideIn delay={500} direction="up">
                        <Button 
                          type="submit" 
                          className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]" 
                          disabled={loading}
                        >
                          {loading ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Signing in...
                            </div>
                          ) : (
                            <>
                              <Zap className="w-4 h-4 mr-2" />
                              Sign in
                            </>
                          )}
                        </Button>
                      </SlideIn>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="signup">
                    <form onSubmit={handleSignUp} className="space-y-5">
                      <SlideIn delay={300} direction="up">
                        <div className="space-y-2">
                          <Label htmlFor="signup-email" className="text-sm font-medium text-slate-700">
                            Email address
                          </Label>
                          <div className="relative group">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                            <Input
                              id="signup-email"
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="Enter your email"
                              className="pl-10 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200 hover:border-slate-300"
                              required
                            />
                          </div>
                        </div>
                      </SlideIn>
                      
                      <SlideIn delay={400} direction="up">
                        <div className="space-y-2">
                          <Label htmlFor="signup-password" className="text-sm font-medium text-slate-700">
                            Password
                          </Label>
                          <div className="relative group">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                            <Input
                              id="signup-password"
                              type={showPassword ? "text" : "password"}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Create a strong password"
                              className="pl-10 pr-10 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200 hover:border-slate-300"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Must be at least 6 characters long
                          </p>
                        </div>
                      </SlideIn>
                      
                      <SlideIn delay={500} direction="up">
                        <Button 
                          type="submit" 
                          className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]" 
                          disabled={loading}
                        >
                          {loading ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Creating account...
                            </div>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Create account
                            </>
                          )}
                        </Button>
                      </SlideIn>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </ScaleIn>
          
          {/* Footer */}
          <FadeIn delay={600}>
            <div className="text-center mt-8">
              <p className="text-xs text-slate-500">
                By continuing, you agree to our{' '}
                <a href="#" className="text-blue-600 hover:text-blue-700 transition-colors duration-200">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-blue-600 hover:text-blue-700 transition-colors duration-200">
                  Privacy Policy
                </a>
              </p>
            </div>
          </FadeIn>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
