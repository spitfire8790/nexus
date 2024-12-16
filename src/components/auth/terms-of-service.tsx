import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
  } from "@/components/ui/dialog";
  
  interface TermsOfServiceProps {
    open: boolean;
    onClose: () => void;
  }
  
  export function TermsOfService({ open, onClose }: TermsOfServiceProps) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Terms of Service</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 text-sm">
            <p className="font-medium">Last Updated: {new Date().toLocaleDateString()}</p>
            
            <section className="space-y-2">
              <h3 className="font-semibold">1. Acceptance of Terms</h3>
              <p>By accessing and using Nexus, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
            </section>
  
            <section className="space-y-2">
              <h3 className="font-semibold">2. Use of Service</h3>
              <p>You agree to use the service only for lawful purposes and in accordance with these Terms. You are responsible for maintaining the confidentiality of your account.</p>
            </section>
  
            <section className="space-y-2">
              <h3 className="font-semibold">3. Data Privacy</h3>
              <p>We only collect personal data if provided by you as part of account creation or through the chat functionality. No personal data is shared with any users. By using Nexus, you consent to this and warrant that all data provided by you is accurate.</p>
            </section>
  
            <section className="space-y-2">
              <h3 className="font-semibold">4. Property Data Usage</h3>
              <p>Property and planning data provided through Nexus is for informational purposes only. Users must verify information independently before making any decisions based on this data.</p>
            </section>
  
            <section className="space-y-2">
              <h3 className="font-semibold">5. Termination</h3>
              <p>We reserve the right to terminate or suspend access to our service immediately, without prior notice, for any breach of these Terms.</p>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    );
  }