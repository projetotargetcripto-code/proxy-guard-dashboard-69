import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowRight, Check } from "lucide-react";
import { Instance } from "@/types/instance";

interface PidData {
  instanceNumber: number;
  pid1: string;
  pid2: string;
}

interface PidTrackerProps {
  instances: Instance[];
  onUpdatePids: (pidUpdates: { instanceId: string; pid1: string; pid2: string }[]) => void;
}

export function PidTracker({ instances, onUpdatePids }: PidTrackerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'input' | 'assignment'>('input');
  const [pidText, setPidText] = useState('');
  const [parsedPids, setParsedPids] = useState<PidData[]>([]);
  const [assignments, setAssignments] = useState<Record<number, string>>({});

  const parsePidText = (text: string): PidData[] => {
    const lines = text.split('\n');
    const pidData: PidData[] = [];
    let currentInstance: number | null = null;
    let memuPid = '';
    let headlessPid = '';

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.includes('Instância') && trimmedLine.includes('MEmu.exe')) {
        const instanceMatch = trimmedLine.match(/Instância (\d+)/);
        const pidMatch = trimmedLine.match(/PID: (\d+)/);
        
        if (instanceMatch && pidMatch) {
          currentInstance = parseInt(instanceMatch[1]);
          memuPid = pidMatch[1];
        }
      } else if (trimmedLine.includes('Instância') && trimmedLine.includes('MEmuHeadless.exe')) {
        const pidMatch = trimmedLine.match(/PID: (\d+)/);
        
        if (pidMatch && currentInstance !== null) {
          headlessPid = pidMatch[1];
          
          pidData.push({
            instanceNumber: currentInstance,
            pid1: memuPid,
            pid2: headlessPid,
          });
          
          currentInstance = null;
          memuPid = '';
          headlessPid = '';
        }
      }
    }

    return pidData;
  };

  const handleSubmitText = () => {
    const parsed = parsePidText(pidText);
    setParsedPids(parsed);
    setStep('assignment');
  };

  const handleAssignmentChange = (pidInstanceNumber: number, targetInstanceId: string) => {
    setAssignments(prev => ({
      ...prev,
      [pidInstanceNumber]: targetInstanceId,
    }));
  };

  const handleApplyPids = () => {
    const updates = Object.entries(assignments).map(([pidInstanceNumber, targetInstanceId]) => ({
      instanceId: targetInstanceId,
      pid1: parsedPids.find(p => p.instanceNumber === parseInt(pidInstanceNumber))?.pid1 || '0000',
      pid2: parsedPids.find(p => p.instanceNumber === parseInt(pidInstanceNumber))?.pid2 || '0000',
    })).filter(update => update.instanceId !== '');

    onUpdatePids(updates);
    handleClose();
  };

  const handleClose = () => {
    setIsOpen(false);
    setStep('input');
    setPidText('');
    setParsedPids([]);
    setAssignments({});
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-accent/20 text-accent hover:bg-accent/10">
          <Search className="h-4 w-4 mr-2" />
          Rastrear PID
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rastreamento de PIDs</DialogTitle>
        </DialogHeader>

        {step === 'input' ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cole o texto dos PIDs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={pidText}
                  onChange={(e) => setPidText(e.target.value)}
                  placeholder="Cole aqui o texto com as informações dos PIDs..."
                  rows={15}
                  className="font-mono text-sm"
                />
                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleClose}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSubmitText}
                    disabled={!pidText.trim()}
                    className="bg-gradient-golden"
                  >
                    Analisar PIDs
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  PIDs Detectados ({parsedPids.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {parsedPids.map((pid) => (
                    <div key={pid.instanceNumber} className="flex items-center gap-4 p-3 border rounded-lg">
                      <Badge variant="outline" className="min-w-[80px]">
                        Instância {pid.instanceNumber}
                      </Badge>
                      <div className="flex gap-2">
                        <Badge variant="secondary">PID1: {pid.pid1}</Badge>
                        <Badge variant="secondary">PID2: {pid.pid2}</Badge>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <Select
                          value={assignments[pid.instanceNumber] || ''}
                          onValueChange={(value) => handleAssignmentChange(pid.instanceNumber, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar instância" />
                          </SelectTrigger>
                          <SelectContent>
                            {instances.map((instance) => (
                              <SelectItem key={instance.id} value={instance.id}>
                                {instance.instance_name} (#{instance.instance_number})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-4">
                  <Button variant="outline" onClick={() => setStep('input')}>
                    Voltar
                  </Button>
                  <Button 
                    onClick={handleApplyPids}
                    disabled={Object.keys(assignments).length === 0}
                    className="bg-gradient-golden"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Aplicar PIDs ({Object.keys(assignments).length})
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}