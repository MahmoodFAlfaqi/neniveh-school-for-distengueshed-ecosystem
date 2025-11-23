import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Eye, EyeOff, ShieldCheck, User, Users } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type RoleType = "student" | "admin" | "visitor" | null;

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<RoleType>(null);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showAdminRegisterPassword, setShowAdminRegisterPassword] = useState(false);
  const [showAdminLoginPassword, setShowAdminLoginPassword] = useState(false);
  const [showAdminCode, setShowAdminCode] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
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
    rememberMe: false,
  });

  const [adminRegisterData, setAdminRegisterData] = useState({
    scientificAnswer: "",
    username: "",
    password: "",
    name: "",
    email: "",
  });

  const [adminLoginData, setAdminLoginData] = useState({
    username: "",
    password: "",
    rememberMe: false,
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

  const adminRegisterMutation = useMutation({
    mutationFn: async (data: typeof adminRegisterData) => {
      return await apiRequest("POST", "/api/auth/admin/register", data);
    },
    onSuccess: () => {
      toast({
        title: "Admin registration successful",
        description: "You've been automatically logged in",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Admin registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const adminLoginMutation = useMutation({
    mutationFn: async (data: typeof adminLoginData) => {
      return await apiRequest("POST", "/api/auth/admin/login", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Admin login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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

  const handleAdminRegister = (e: React.FormEvent) => {
    e.preventDefault();
    adminRegisterMutation.mutate(adminRegisterData);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    adminLoginMutation.mutate(adminLoginData);
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
                    <div className="text-xs text-muted-foreground">Login or register with credentials</div>
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
                  <TabsTrigger value="login" data-testid="tab-admin-login">Login</TabsTrigger>
                  <TabsTrigger value="register" data-testid="tab-admin-register">Register</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleAdminLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="admin-login-username">Username</Label>
                      <Input
                        id="admin-login-username"
                        type="text"
                        placeholder="admin.username"
                        value={adminLoginData.username}
                        onChange={(e) => setAdminLoginData({ ...adminLoginData, username: e.target.value })}
                        required
                        data-testid="input-admin-username-login"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-login-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="admin-login-password"
                          type={showAdminLoginPassword ? "text" : "password"}
                          value={adminLoginData.password}
                          onChange={(e) => setAdminLoginData({ ...adminLoginData, password: e.target.value })}
                          required
                          data-testid="input-admin-password-login"
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowAdminLoginPassword(!showAdminLoginPassword)}
                          data-testid="button-toggle-admin-password-login"
                        >
                          {showAdminLoginPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="remember-me" 
                        checked={adminLoginData.rememberMe}
                        onCheckedChange={(checked) => 
                          setAdminLoginData({ ...adminLoginData, rememberMe: checked as boolean })
                        }
                        data-testid="checkbox-remember-me"
                      />
                      <Label htmlFor="remember-me" className="text-sm cursor-pointer">
                        Remember me for 7 days
                      </Label>
                    </div>
                    <Button type="submit" className="w-full" disabled={adminLoginMutation.isPending} data-testid="button-admin-login">
                      {adminLoginMutation.isPending ? "Logging in..." : "Admin Login"}
                    </Button>
                  </form>
                </TabsContent>
            
                <TabsContent value="register">
                  <form onSubmit={handleAdminRegister} className="space-y-4">
                    <Alert>
                      <ShieldCheck className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        Contact the system administrator to obtain the administration code required for registration.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-2">
                      <Label htmlFor="admin-code">Administration Code</Label>
                      <div className="relative">
                        <Input
                          id="admin-code"
                          type={showAdminCode ? "text" : "password"}
                          placeholder="Enter administration code"
                          value={adminRegisterData.scientificAnswer}
                          onChange={(e) => setAdminRegisterData({ ...adminRegisterData, scientificAnswer: e.target.value })}
                          required
                          data-testid="input-admin-code"
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowAdminCode(!showAdminCode)}
                          data-testid="button-toggle-admin-code"
                        >
                          {showAdminCode ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Ask your system administrator for the administration code
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="admin-register-name">Full Name</Label>
                      <Input
                        id="admin-register-name"
                        placeholder="John Doe"
                        value={adminRegisterData.name}
                        onChange={(e) => setAdminRegisterData({ ...adminRegisterData, name: e.target.value })}
                        required
                        data-testid="input-admin-name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="admin-register-username">Username</Label>
                      <Input
                        id="admin-register-username"
                        placeholder="admin.username"
                        value={adminRegisterData.username}
                        onChange={(e) => setAdminRegisterData({ ...adminRegisterData, username: e.target.value })}
                        required
                        data-testid="input-admin-username"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="admin-register-email">Email</Label>
                      <Input
                        id="admin-register-email"
                        type="email"
                        placeholder="admin@school.edu"
                        value={adminRegisterData.email}
                        onChange={(e) => setAdminRegisterData({ ...adminRegisterData, email: e.target.value })}
                        required
                        data-testid="input-admin-email"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="admin-register-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="admin-register-password"
                          type={showAdminRegisterPassword ? "text" : "password"}
                          placeholder="Minimum 6 characters"
                          value={adminRegisterData.password}
                          onChange={(e) => setAdminRegisterData({ ...adminRegisterData, password: e.target.value })}
                          required
                          data-testid="input-admin-password"
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowAdminRegisterPassword(!showAdminRegisterPassword)}
                          data-testid="button-toggle-admin-password-register"
                        >
                          {showAdminRegisterPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={adminRegisterMutation.isPending} data-testid="button-admin-register">
                      {adminRegisterMutation.isPending ? "Registering..." : "Register as Admin"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </>
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
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="remember-me-student" 
                        checked={loginData.rememberMe}
                        onCheckedChange={(checked) => 
                          setLoginData({ ...loginData, rememberMe: checked as boolean })
                        }
                        data-testid="checkbox-remember-me-student"
                      />
                      <Label htmlFor="remember-me-student" className="text-sm cursor-pointer">
                        Remember me for 7 days
                      </Label>
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
                      <p className="text-xs text-muted-foreground">1-5 names, letters/periods/hyphens/commas, single spaces between names</p>
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
