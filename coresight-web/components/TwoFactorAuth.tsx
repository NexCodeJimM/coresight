import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface TwoFactorAuthProps {
  userId: string;
  enabled: boolean;
  onUpdate: () => void;
  adminMode?: boolean;
}

export function TwoFactorAuth({ userId, enabled, onUpdate, adminMode = false }: TwoFactorAuthProps) {
  const { toast } = useToast();
  const [setupMode, setSetupMode] = useState(false);
  const [qrCode, setQrCode] = useState<string>();
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const startSetup = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${userId}/2fa`, {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setQrCode(data.qrCode);
      setSetupMode(true);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start 2FA setup",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${userId}/2fa`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: verificationCode }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      toast({
        title: "Success",
        description: "Two-factor authentication enabled",
        variant: "success"
      });
      setSetupMode(false);
      setQrCode(undefined);
      setVerificationCode("");
      onUpdate();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Invalid verification code",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    try {
      setLoading(true);

      // Skip password verification if in admin mode
      if (!adminMode) {
        setError(null);
        if (!password) {
          setError("Password is required");
          return;
        }

        // Verify password only for non-admin mode
        const verifyResponse = await fetch("/api/profile/verify-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });

        if (!verifyResponse.ok) {
          throw new Error("Invalid password");
        }
      }

      // Proceed with disabling 2FA
      const response = await fetch(`/api/users/${userId}/2fa`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to disable 2FA");
      }

      toast({
        title: "Success",
        description: adminMode 
          ? "User's two-factor authentication disabled"
          : "Two-factor authentication disabled",
      });
      setShowDisableDialog(false);
      setPassword("");
      onUpdate();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to disable 2FA");
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to disable 2FA",
      });
    } finally {
      setLoading(false);
    }
  };

  if (setupMode) {
    return (
      <Card>
        <CardContent className="space-y-4 pt-6">
          <h3 className="text-lg font-medium">Setup Two-Factor Authentication</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                1. Install an authenticator app like Google Authenticator or Authy
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                2. Scan this QR code with your authenticator app
              </p>
              {qrCode && (
                <div className="flex justify-center bg-white p-4 rounded-lg">
                  <Image
                    src={qrCode}
                    alt="QR Code"
                    width={200}
                    height={200}
                    className="rounded-lg"
                  />
                </div>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                3. Enter the 6-digit code from your authenticator app
              </p>
              <div className="flex gap-4">
                <Input
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="max-w-[200px]"
                />
                <Button onClick={verifyAndEnable} disabled={loading}>
                  {loading ? "Verifying..." : "Verify"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSetupMode(false);
                    setQrCode(undefined);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (adminMode) {
    return (
      <Button
        onClick={() => setShowDisableDialog(true)}
        variant="destructive"
        disabled={loading}
      >
        {loading ? "Processing..." : "Disable User's 2FA"}
      </Button>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {enabled
            ? "Two-factor authentication is currently enabled"
            : "Add an extra layer of security to your account by enabling two-factor authentication"}
        </p>
        <Button
          onClick={enabled ? () => setShowDisableDialog(true) : startSetup}
          variant={enabled ? "destructive" : "default"}
          disabled={loading}
        >
          {loading
            ? "Processing..."
            : enabled
            ? "Disable 2FA"
            : "Enable Two-Factor Authentication"}
        </Button>
      </div>

      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {adminMode ? "Disable User's Two-Factor Authentication" : "Disable Two-Factor Authentication"}
            </DialogTitle>
            <DialogDescription>
              {adminMode 
                ? "This will remove two-factor authentication from the user's account."
                : "This will remove an important security feature from your account. Please enter your password to confirm."
              }
            </DialogDescription>
          </DialogHeader>

          {!adminMode && (
            <div className="space-y-4">
              {error && (
                <div className="text-sm text-red-500">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDisableDialog(false);
                setPassword("");
                setError(null);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisable2FA}
              disabled={loading}
            >
              {loading ? "Disabling..." : adminMode ? "Disable User's 2FA" : "Disable 2FA"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 