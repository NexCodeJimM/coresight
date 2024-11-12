"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings } from "lucide-react";
import { ThresholdConfig, DEFAULT_THRESHOLDS } from "@/lib/threshold-config";

interface ThresholdSettingsProps {
  thresholds: ThresholdConfig;
  onUpdate: (newThresholds: ThresholdConfig) => void;
}

export function ThresholdSettings({
  thresholds,
  onUpdate,
}: ThresholdSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState(thresholds);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(config);
    setIsOpen(false);
  };

  const handleReset = () => {
    setConfig(DEFAULT_THRESHOLDS);
    onUpdate(DEFAULT_THRESHOLDS);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Threshold Settings
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alert Thresholds</DialogTitle>
          <DialogDescription>
            Configure warning and critical thresholds for system metrics
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {Object.entries(config).map(([metric, values]) => (
            <div key={metric} className="space-y-4">
              <h3 className="font-medium capitalize">{metric} Thresholds</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm">Warning (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={values.warning}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        [metric]: {
                          ...values,
                          warning: Number(e.target.value),
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm">Critical (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={values.critical}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        [metric]: {
                          ...values,
                          critical: Number(e.target.value),
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          ))}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleReset}>
              Reset to Default
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
