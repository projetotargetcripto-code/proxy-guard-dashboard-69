import { useState } from "react";
import { Activity, Send, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Instance } from "@/types/instance";

interface PidData {
  instanceNumber: number;
  pid1: string; // MEmu.exe
  pid2: string; // MEmuHeadless.exe
}

interface PidTrackerProps {
  instances: Instance[];
  onUpdatePids: (pidUpdates: { instanceId: string; pid1: string; pid2: string }[]) => void;
}

export function PidTracker({ instances, onUpdatePids }: PidTrackerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'input' | 'assign'>('input');
  const [pidText, setPidText] = useState("");
  const [parsedPids, setParsedPids] = useState<PidData[]>([]);
  const [assignments, setAssignments] = useState<Record<number, string>>({});
  const { toast } = useToast();

  const parsePidText = (text: string): PidData[] => {
    try {
      const blocks = text.split('-------------------------------').filter(block => block.trim());
      const pidData: PidData[] = [];

      blocks.forEach(block => {
        const lines = block.trim().split('\n').filter(line => line.trim());
        
        if (lines.length >= 2) {
          let instanceNumber = 0;
          let pid1 = '';
          let pid2 = '';

          lines.forEach(line => {
            const instanceMatch = line.match(/Instância (\d+)/);
            const pidMatch = line.match(/PID: (\d+)/);

            if (instanceMatch) {
              instanceNumber = parseInt(instanceMatch[1]);
            }

            if (pidMatch && line.includes('MEmu.exe')) {
              pid1 = pidMatch[1];
            } else if (pidMatch && line.includes('MEmuHeadless.exe')) {
              pid2 = pidMatch[1];
            }
          });

          if (instanceNumber > 0 && pid1 && pid2) {
            pidData.push({
              instanceNumber,
              pid1,
              pid2
            });
          }
        }
      });

      return pidData;
    } catch (error) {
      console.error('Erro ao fazer parse dos PIDs:', error);
      return [];
    }
  };

  const handleSubmitText = () => {
    if (!pidText.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, cole os dados dos PIDs.",
        variant: "destructive",
      });
      return;
    }

    const parsed = parsePidText(pidText);
    
    if (parsed.length === 0) {
      toast({
        title: "Erro",
        description: "Não foi possível extrair os PIDs do texto fornecido.",
        variant: "destructive",
      });
      return;
    }

    setParsedPids(parsed);
    setStep('assign');
    
    toast({
      title: "PIDs extraídos",
      description: `${parsed.length} instâncias com PIDs foram encontradas.`,
    });
  };

  const handleAssignmentChange = (pidInstanceNumber: number, targetInstanceId: string) => {
    setAssignments(prev => ({
      ...prev,
      [pidInstanceNumber]: targetInstanceId
    }));
  };

  const handleApplyPids = () => {
    const updates: { instanceId: string; pid1: string; pid2: string }[] = [];

    Object.entries(assignments).forEach(([pidInstanceNumber, targetInstanceId]) => {
      const pidData = parsedPids.find(p => p.instanceNumber === parseInt(pidInstanceNumber));
      if (pidData && targetInstanceId) {
        updates.push({
          instanceId: targetInstanceId,
          pid1: pidData.pid1,
          pid2: pidData.pid2
        });
      }
    });

    if (updates.length === 0) {
      toast({
        title: "Erro",
        description: "Nenhuma associação foi feita.",
        variant: "destructive",
      });
      return;
    }

    onUpdatePids(updates);
    
    // Reset state
    setIsOpen(false);
    setStep('input');
    setPidText('');
    setParsedPids([]);
    setAssignments({});
    
    toast({
      title: "PIDs atualizados",
      description: `${updates.length} instâncias foram atualizadas com sucesso.`,
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    setStep('input');
    setPidText('');
    setParsedPids([]);
    setAssignments({});
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="border-primary/20 hover:border-primary/40"
      >
        <Activity className="mr-2 h-4 w-4" />
        Rastrear PID
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-primary">
              {step === 'input' ? 'Rastrear PIDs' : 'Associar PIDs às Instâncias'}
            </DialogTitle>
          </DialogHeader>

          {step === 'input' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="pid-text" className="text-sm font-medium">
                  Cole aqui os dados dos PIDs das instâncias:
                </Label>
                <Textarea
                  id="pid-text"
                  value={pidText}
                  onChange={(e) => setPidText(e.target.value)}
                  placeholder="Cole aqui o texto com os dados das instâncias e PIDs..."
                  className="min-h-[300px] mt-2"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmitText}>
                  <Send className="mr-2 h-4 w-4" />
                  Processar PIDs
                </Button>
              </div>
            </div>
          )}

          {step === 'assign' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep('input')}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Associe os PIDs extraídos às suas instâncias
                </span>
              </div>

              <div className="grid gap-4 max-h-[400px] overflow-y-auto">
                {parsedPids.map((pidData) => (
                  <Card key={pidData.instanceNumber} className="border-border/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-primary">
                        Instância Rastreada #{pidData.instanceNumber}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">PID 1 (MEmu.exe):</span>
                          <span className="ml-2 font-mono font-bold text-primary">{pidData.pid1}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">PID 2 (MEmuHeadless.exe):</span>
                          <span className="ml-2 font-mono font-bold text-primary">{pidData.pid2}</span>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm">Associar à instância:</Label>
                        <Select
                          value={assignments[pidData.instanceNumber] || ''}
                          onValueChange={(value) => handleAssignmentChange(pidData.instanceNumber, value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Selecione uma instância..." />
                          </SelectTrigger>
                          <SelectContent>
                            {instances.map((instance) => (
                              <SelectItem key={instance.id} value={instance.id}>
                                {instance.instanceName} (#{instance.instanceNumber})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setStep('input')}>
                  Voltar
                </Button>
                <Button onClick={handleApplyPids} className="bg-gradient-golden">
                  Aplicar PIDs
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}