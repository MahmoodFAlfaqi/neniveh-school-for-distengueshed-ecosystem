import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Eye, EyeOff, ShieldCheck, User, Users } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type RoleType = "student" | "admin" | "visitor" | null;

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<RoleType>(null);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [adminAnswer, setAdminAnswer] = useState("");
  const [registerData, setRegisterData] = useState({
    username: "",
    studentId: "",
    email: "",
    password: "",
    phone: "",
  });
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });

  // Fetch random security question for admin
  const { data: questionData } = useQuery({
    queryKey: ["/api/auth/admin-question"],
    enabled: selectedRole === "admin",
  });

  const registerMutation = useMutation({
    mutationFn: async (data: typeof registerData) => {
      return await apiRequest("POST", "/api/auth/register", data);
    },
    onSuccess: () => {
      toast({
        title: "Registration successful",
        description: "You've been automatically logged in",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: typeof loginData) => {
      return await apiRequest("POST", "/api/auth/login", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Admin verification mutation
  const adminVerifyMutation = useMutation({
    mutationFn: async (answer: string) => {
      return await apiRequest("POST", "/api/auth/admin-verify", { answer });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Visitor access mutation
  const visitorMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/auth/visitor", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Access failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(registerData);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  const handleAdminVerify = (e: React.FormEvent) => {
    e.preventDefault();
    adminVerifyMutation.mutate(adminAnswer);
  };

  const handleVisitorAccess = () => {
    visitorMutation.mutate();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">School Community</CardTitle>
          <CardDescription>Join your school's digital ecosystem</CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedRole ? (
            <div className="space-y-4">
              <Label>Select your role to continue</Label>
              <div className="grid grid-cols-1 gap-3">
                <Button
                  variant="outline"
                  className="h-auto py-4 justify-start"
                  onClick={() => setSelectedRole("student")}
                  data-testid="button-role-student"
                >
                  <User className="mr-2 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-semibold">Student</div>
                    <div className="text-xs text-muted-foreground">Login or register as a student</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 justify-start"
                  onClick={() => setSelectedRole("admin")}
                  data-testid="button-role-admin"
                >
                  <ShieldCheck className="mr-2 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-semibold">Admin</div>
                    <div className="text-xs text-muted-foreground">Verify admin access via security question</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 justify-start"
                  onClick={() => setSelectedRole("visitor")}
                  data-testid="button-role-visitor"
                >
                  <Users className="mr-2 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-semibold">Visitor</div>
                    <div className="text-xs text-muted-foreground">Browse as a guest (read-only)</div>
                  </div>
                </Button>
              </div>
            </div>
          ) : selectedRole === "admin" ? (
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedRole(null)}
                className="mb-2"
                data-testid="button-back"
              >
                ← Back
              </Button>
              <Alert>
                <ShieldCheck className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Answer the security question to verify admin access
                </AlertDescription>
              </Alert>
              <form onSubmit={handleAdminVerify} className="space-y-4">
                <div className="space-y-2">
                  <Label>{questionData?.question || "Loading question..."}</Label>
                  <Input
                    type="text"
                    placeholder="Enter your answer"
                    value={adminAnswer}
                    onChange={(e) => setAdminAnswer(e.target.value)}
                    required
                    data-testid="input-admin-answer"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={adminVerifyMutation.isPending} data-testid="button-admin-verify">
                  {adminVerifyMutation.isPending ? "Verifying..." : "Verify Admin Access"}
                </Button>
              </form>
            </div>
          ) : selectedRole === "visitor" ? (
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedRole(null)}
                className="mb-2"
                data-testid="button-back"
              >
                ← Back
              </Button>
              <Alert>
                <Users className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  As a visitor, you can browse the platform but cannot make any changes or interact with content.
                </AlertDescription>
              </Alert>
              <Button
                onClick={handleVisitorAccess}
                className="w-full"
                disabled={visitorMutation.isPending}
                data-testid="button-visitor-access"
              >
                {visitorMutation.isPending ? "Accessing..." : "Continue as Visitor"}
              </Button>
            </div>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedRole(null)}
                className="mb-4"
                data-testid="button-back"
              >
                ← Back
              </Button>
              <Tabs defaultValue="login">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="login" data-testid="tab-login">Login</TabsTrigger>
                  <TabsTrigger value="register" data-testid="tab-register">Register</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                  <Label htmlFor="login-username">Username</Label>
                  <Input
                    id="login-username"
                    type="text"
                    placeholder="Mahmood.Fawaz.AL-Faqi"
                    value={loginData.username}
                    onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                    required
                    data-testid="input-username-login"
                  />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showLoginPassword ? "text" : "password"}
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                      data-testid="input-password-login"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      data-testid="button-toggle-password-login"
                    >
                      {showLoginPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={loginMutation.isPending} data-testid="button-login">
                      {loginMutation.isPending ? "Logging in..." : "Login"}
                    </Button>
                    <div className="text-center">
                      <Link href="/forgot-password" className="text-sm text-primary hover:underline" data-testid="link-forgot-password">
                        Forgot password?
                      </Link>
                    </div>
                  </form>
                </TabsContent>
            
                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        You need an admin-assigned Student ID to register. Contact your administrator.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-2">
                  <Label htmlFor="register-username">Username</Label>
                  <Input
                    id="register-username"
                    placeholder="John.Smith or Jane.Doe.Williams"
                    value={registerData.username}
                    onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                    required
                    data-testid="input-username"
                      />
                      <p className="text-xs text-muted-foreground">2-5 names with letters, periods, hyphens, or commas only</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-studentId">Student ID</Label>
                      <Input
                        id="register-studentId"
                        placeholder="ST2024001"
                        value={registerData.studentId}
                        onChange={(e) => setRegisterData({ ...registerData, studentId: e.target.value })}
                        required
                        data-testid="input-studentid"
                      />
                      <p className="text-xs text-muted-foreground">Use the ID provided by your administrator (matches your username)</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="john.smith@school.edu"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        required
                        data-testid="input-email"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="register-password"
                          type={showRegisterPassword ? "text" : "password"}
                          placeholder="Minimum 8 characters"
                          value={registerData.password}
                          onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                          required
                          data-testid="input-password"
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                          data-testid="button-toggle-password-register"
                        >
                          {showRegisterPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-phone">Phone (Optional)</Label>
                      <Input
                        id="register-phone"
                        type="tel"
                        placeholder="+1234567890"
                        value={registerData.phone}
                        onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                        data-testid="input-phone"
                      />
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={registerMutation.isPending} data-testid="button-register">
                      {registerMutation.isPending ? "Registering..." : "Register"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
