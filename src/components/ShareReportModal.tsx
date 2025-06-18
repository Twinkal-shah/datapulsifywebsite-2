import { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';

interface ShareReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateLink: (selectedComponents: string[]) => void;
}

const reportComponents = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'rankTracker', label: 'Rank Tracker' },
  // Add other relevant features here
];

export function ShareReportModal({ isOpen, onClose, onGenerateLink }: ShareReportModalProps) {
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);

  const handleCheckboxChange = (componentId: string) => {
    setSelectedComponents(prev =>
      prev.includes(componentId)
        ? prev.filter(id => id !== componentId)
        : [...prev, componentId]
    );
  };

  const handleGenerateLink = () => {
    onGenerateLink(selectedComponents);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>Share Report</DialogTitle>
          <DialogDescription className="text-gray-400">
            Select the components you want to include in the shared report.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {reportComponents.map(component => (
            <div key={component.id} className="flex items-center space-x-2">
              <Checkbox
                id={component.id}
                checked={selectedComponents.includes(component.id)}
                onCheckedChange={() => handleCheckboxChange(component.id)}
                className="border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white"
              />
              <Label htmlFor={component.id} className="text-gray-300">
                {component.label}
              </Label>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white">
            Cancel
          </Button>
          <Button onClick={handleGenerateLink} className="bg-blue-600 hover:bg-blue-700 text-white">
            Generate Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 