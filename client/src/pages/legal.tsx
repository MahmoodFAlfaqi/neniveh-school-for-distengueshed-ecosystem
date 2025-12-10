import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, FileText, AlertTriangle, Scale } from "lucide-react";
import { Link } from "wouter";

export default function LegalPage() {
  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/settings">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Scale className="w-8 h-8" />
              Terms of Service & Legal
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Please read these terms carefully before using our platform
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <Card className="border-amber-500/50 bg-amber-500/5" data-testid="card-disclaimer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              Important Disclaimer
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <p>
              This platform is designed for educational purposes within school communities. 
              By using this service, you acknowledge and agree to the following terms.
            </p>
          </CardContent>
        </Card>

        {/* Terms Section 1 */}
        <Card data-testid="card-intermediary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              1. Intermediary Role
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>
              This platform is a technical service provider only. We provide the infrastructure 
              for communication within school communities but do not create, endorse, or actively 
              monitor user-generated content.
            </p>
            <p>
              We act as a neutral intermediary, similar to how email providers or messaging 
              platforms operate. The content shared is created entirely by users of the platform.
            </p>
          </CardContent>
        </Card>

        {/* Terms Section 2 */}
        <Card data-testid="card-liability">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              2. No Liability
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>
              <strong className="text-foreground">The platform acts as a neutral host.</strong> We are not liable for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Defamatory statements or insults posted by users</li>
              <li>Inaccurate or misleading information shared by community members</li>
              <li>Illegal content uploaded by users</li>
              <li>Disputes between users arising from platform interactions</li>
              <li>Any damages resulting from reliance on user-generated content</li>
            </ul>
            <p className="font-medium text-foreground mt-4">
              Each user bears full legal responsibility for their own posts, comments, and interactions.
            </p>
          </CardContent>
        </Card>

        {/* Terms Section 3 */}
        <Card data-testid="card-dmca">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              3. Content Takedown Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>
              We <strong className="text-foreground">strictly prohibit illegal activities</strong> on this platform. We commit to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Full cooperation with school administrations regarding content concerns</li>
              <li>Compliance with legal authorities when presented with valid requests</li>
              <li>Prompt investigation of reported content</li>
              <li>Removal of content that violates our policies upon verification</li>
            </ul>
            <div className="p-3 bg-muted rounded-lg mt-4">
              <p className="font-medium text-foreground">
                How to Report Content:
              </p>
              <p className="mt-1">
                If you see infringing, defamatory, or otherwise problematic content, use the 
                <strong className="text-foreground"> 'Report' button</strong> available on posts, profiles, 
                and files. We will review and take action upon verification.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Terms Section 4 */}
        <Card data-testid="card-responsibility">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="w-5 h-5" />
              4. User Responsibility & Indemnification
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p className="font-medium text-foreground">
              By using this platform, you agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Take full responsibility for all content you create, share, or upload</li>
              <li>Not post content that is defamatory, harassing, or illegal</li>
              <li>Respect the privacy and rights of other users</li>
              <li>Comply with all applicable school policies and local laws</li>
              <li>
                <strong className="text-foreground">Indemnify and hold harmless</strong> the platform administrators 
                from any legal claims, damages, or expenses arising from your content or actions
              </li>
            </ul>
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg mt-4">
              <p className="font-semibold text-foreground">
                Acceptance of Terms
              </p>
              <p className="mt-2">
                By registering for and using this platform, you acknowledge that you have read, 
                understood, and agree to be bound by these terms. If you do not agree to these 
                terms, please do not use the platform.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Section */}
        <Card data-testid="card-contact">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              For legal inquiries or to report serious violations, please contact your 
              school administration or use the in-app reporting system.
            </p>
          </CardContent>
        </Card>

        <div className="pb-8 text-center text-xs text-muted-foreground">
          <p>Last updated: December 2024</p>
        </div>
      </div>
    </div>
  );
}
