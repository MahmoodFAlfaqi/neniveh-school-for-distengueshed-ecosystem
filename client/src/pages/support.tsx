import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Heart, ExternalLink, Settings } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

type DonationUrlResponse = {
  url: string | null;
};

const donationUrlSchema = z.object({
  url: z.string().url("Please enter a valid URL").min(1, "URL is required"),
});

type DonationUrlFormData = z.infer<typeof donationUrlSchema>;

export default function SupportPage() {
  const { user } = useUser();
  const { toast } = useToast();

  const { data, isLoading } = useQuery<DonationUrlResponse>({
    queryKey: ["/api/settings/donation-url"],
  });

  const form = useForm<DonationUrlFormData>({
    resolver: zodResolver(donationUrlSchema),
    defaultValues: {
      url: "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (formData: DonationUrlFormData) => {
      return await apiRequest("PUT", "/api/admin/settings/donation-url", formData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Donation URL updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/donation-url"] });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update donation URL",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (formData: DonationUrlFormData) => {
    updateMutation.mutate(formData);
  };

  const handleSupport = () => {
    if (data?.url) {
      window.open(data.url, "_blank", "noopener,noreferrer");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-muted rounded w-1/4" data-testid="skeleton-title" />
          <div className="h-64 bg-muted rounded" data-testid="skeleton-content" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight" data-testid="text-page-title">
          Support
        </h1>
        <p className="text-base text-muted-foreground" data-testid="text-page-description">
          {user?.role === "admin" 
            ? "Configure donation settings for the platform"
            : "Support the creator and help keep this platform running"}
        </p>
      </div>

      {user?.role === "admin" ? (
        <Card data-testid="card-admin-config">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Donation Configuration
            </CardTitle>
            <CardDescription>
              Set the external donation URL (e.g., Stripe, PayPal, Buy Me a Coffee). No credit card information is stored on this platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-url">Current Donation URL</Label>
                <div className="flex items-center gap-2">
                  {data?.url ? (
                    <>
                      <Input
                        id="current-url"
                        value={data.url}
                        readOnly
                        className="flex-1"
                        data-testid="input-current-url"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => window.open(data.url!, "_blank", "noopener,noreferrer")}
                        data-testid="button-test-url"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground" data-testid="text-no-url">
                      No donation URL configured yet
                    </p>
                  )}
                </div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {data?.url ? "Update Donation URL" : "Set Donation URL"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            placeholder="https://buymeacoffee.com/yourname"
                            data-testid="input-donation-url"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Examples: Stripe Checkout, PayPal.me, Buy Me a Coffee, Ko-fi
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={updateMutation.isPending}
                    data-testid="button-save-url"
                  >
                    {updateMutation.isPending ? "Saving..." : "Save URL"}
                  </Button>
                </form>
              </Form>
            </div>

            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-2">Important Notes</h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>This platform does NOT store credit card information</li>
                <li>Users will be redirected to your external payment processor</li>
                <li>Make sure the URL is publicly accessible and secure (HTTPS)</li>
                <li>Test the URL before saving to ensure it works correctly</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card data-testid="card-user-support">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <div className="flex justify-center" data-testid="icon-heart-container">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <Heart className="w-10 h-10 text-primary" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-bold" data-testid="text-support-heading">
                    Support the Creator
                  </h2>
                  <p className="text-muted-foreground max-w-md mx-auto" data-testid="text-support-description">
                    This platform is made possible by community support. Your contribution helps maintain and improve the platform for everyone.
                  </p>
                </div>

                {data?.url ? (
                  <div className="space-y-4">
                    <Button
                      size="lg"
                      onClick={handleSupport}
                      className="gap-2"
                      data-testid="button-support-creator"
                    >
                      <Heart className="w-5 h-5" />
                      Support the Creator
                    </Button>
                    <p className="text-xs text-muted-foreground" data-testid="text-redirect-notice">
                      You'll be redirected to a secure external payment page
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2" data-testid="text-no-donation-configured">
                    <p className="text-muted-foreground">
                      Donation support is not currently configured.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Please check back later or contact the administrator.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-why-support">
            <CardHeader>
              <CardTitle className="text-lg">Why Support?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm" data-testid="text-benefit-heading-1">
                  Platform Maintenance
                </h4>
                <p className="text-sm text-muted-foreground" data-testid="text-benefit-description-1">
                  Keep the servers running and ensure smooth performance for all users.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm" data-testid="text-benefit-heading-2">
                  New Features
                </h4>
                <p className="text-sm text-muted-foreground" data-testid="text-benefit-description-2">
                  Support helps fund development of new features and improvements.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm" data-testid="text-benefit-heading-3">
                  Community Growth
                </h4>
                <p className="text-sm text-muted-foreground" data-testid="text-benefit-description-3">
                  Contributions enable us to expand and better serve the community.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
