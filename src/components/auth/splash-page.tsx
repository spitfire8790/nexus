import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Globe2, Info, CheckCircle2, XCircle } from "lucide-react";
import { Card } from '@/components/ui/card';
import { TermsOfService } from './terms-of-service';
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";

export function SplashPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordsMatch, setPasswordsMatch] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (confirmPassword || password) {
      setPasswordsMatch(password === confirmPassword);
    }
  }, [password, confirmPassword]);

  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      return "Password must be at least 8 characters long";
    }
    if (!hasUpperCase || !hasLowerCase) {
      return "Password must contain both uppercase and lowercase letters";
    }
    if (!hasNumbers) {
      return "Password must contain at least one number";
    }
    if (!hasSpecialChar) {
      return "Password must contain at least one special character";
    }
    return null;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      toast({
        title: "Terms of Service Required",
        description: "Please accept the terms of service to create an account",
        variant: "destructive"
      });
      return;
    }

    if (!passwordsMatch) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure your passwords match",
        variant: "destructive"
      });
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      toast({
        title: "Invalid Password",
        description: passwordError,
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      // Check username availability
      const { count, error: checkError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('username', username);

      if (checkError) {
        throw checkError;
      }

      if (count && count > 0) {
        toast({
          title: "Username taken",
          description: "Please choose a different username",
          variant: "destructive"
        });
        return;
      }

      // Attempt signup
      const { data: { user }, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username
          }
        }
      });

      if (error) throw error;

      if (user) {
        toast({
          title: "Account created!",
          description: "You can now sign in with your credentials.",
        });
        
        // Clear form
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setUsername('');
        setAcceptedTerms(false);
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: "Error",
        description: error.message === "User already registered" 
          ? "This email is already registered. Please sign in instead."
          : error.message || "Failed to create account",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <Logo className="scale-150 mb-4" />
        <h1 className="text-4xl font-bold tracking-tight mb-2">Nexus</h1>
        <p className="text-muted-foreground">Property and Planning Analytics</p>
      </div>

      <Card className="w-full max-w-md p-6 shadow-xl">
        <Tabs defaultValue="login">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11"
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <Input
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
              <div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn(
                      password && !validatePassword(password) && "border-destructive"
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={cn(
                      confirmPassword && !passwordsMatch && "border-destructive",
                      confirmPassword && passwordsMatch && "border-green-500"
                    )}
                  />
                  {confirmPassword && (
                    <div className="absolute right-2 top-2.5">
                      {passwordsMatch ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                  )}
                </div>
                {confirmPassword && !passwordsMatch && (
                  <p className="text-sm text-destructive">Passwords do not match</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                />
                <label
                  htmlFor="terms"
                  className="text-sm text-muted-foreground"
                >
                  I agree to the{" "}
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => setShowTerms(true)}
                  >
                    terms of service
                  </button>
                </label>
              </div>
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
      <TermsOfService open={showTerms} onClose={() => setShowTerms(false)} />
    </div>
  );
}