import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Rocket, MessageSquare, FolderOpen, CheckCircle2 } from 'lucide-react';

interface Project {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface Chat {
  id: number;
  name: string;
  projectId: number;
  chatType: string;
  status: string;
  createdAt: string;
}

interface RateLimitInfo {
  remaining: number;
  resetAt: string;
}

export default function V0ToolsPage() {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  // Form states
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Load chats when project is selected
  useEffect(() => {
    if (selectedProject) {
      loadProjectDetails(selectedProject.id);
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v0-tools/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load projects',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      toast({
        title: 'Error',
        description: 'Failed to load projects',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProjectDetails = async (projectId: number) => {
    try {
      const response = await fetch(`/api/v0-tools/projects/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setChats(data.chats || []);
      }
    } catch (error) {
      console.error('Error loading project details:', error);
    }
  };

  const createProject = async () => {
    if (!projectName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Project name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/v0-tools/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName,
          description: projectDescription,
        }),
      });

      if (response.ok) {
        const newProject = await response.json();
        setProjects([...projects, newProject]);
        setProjectName('');
        setProjectDescription('');
        toast({
          title: 'Success',
          description: 'Project created successfully',
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to create project',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: 'Error',
        description: 'Failed to create project',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateApp = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Prompt is required',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedProject) {
      toast({
        title: 'Validation Error',
        description: 'Please select a project first',
        variant: 'destructive',
      });
      return;
    }

    try {
      setGenerating(true);
      const response = await fetch('/api/v0-tools/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          projectId: selectedProject.id,
          chatName: prompt.slice(0, 50),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setRateLimitInfo(data.rateLimit);
        setPrompt('');
        
        // Reload project details to get the new chat
        await loadProjectDetails(selectedProject.id);
        
        toast({
          title: 'Success',
          description: 'App generated successfully!',
        });
      } else if (response.status === 429) {
        const error = await response.json();
        toast({
          title: 'Rate Limit Exceeded',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to generate app',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error generating app:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate app',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">V0-Like AI App Generation</h1>
          <p className="text-muted-foreground">
            Create applications from natural language prompts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Rocket className="h-6 w-6 text-primary" />
        </div>
      </div>

      {rateLimitInfo && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <p className="text-sm text-blue-900 dark:text-blue-100">
                Generations remaining: <strong>{rateLimitInfo.remaining}</strong> | 
                Resets at: {new Date(rateLimitInfo.resetAt).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList>
          <TabsTrigger value="generate">
            <MessageSquare className="h-4 w-4 mr-2" />
            Generate App
          </TabsTrigger>
          <TabsTrigger value="projects">
            <FolderOpen className="h-4 w-4 mr-2" />
            Projects
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate AI Application</CardTitle>
              <CardDescription>
                Describe the application you want to create
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Project</label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={selectedProject?.id || ''}
                  onChange={(e) => {
                    const project = projects.find(p => p.id === Number(e.target.value));
                    setSelectedProject(project || null);
                  }}
                  disabled={projects.length === 0}
                >
                  <option value="">Select a project...</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Prompt</label>
                <Textarea
                  placeholder="Describe your application... e.g., 'Create a todo list app with React and TypeScript'"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={6}
                  disabled={generating}
                />
              </div>

              <Button
                onClick={generateApp}
                disabled={generating || !selectedProject}
                className="w-full"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Rocket className="mr-2 h-4 w-4" />
                    Generate App
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {selectedProject && chats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Chats in {selectedProject.name}</CardTitle>
                <CardDescription>
                  Recent conversations and generated apps
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {chats.map((chat) => (
                    <div
                      key={chat.id}
                      className="flex items-center justify-between p-3 border rounded-md hover:bg-accent"
                    >
                      <div className="flex items-center gap-3">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{chat.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(chat.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Project</CardTitle>
              <CardDescription>
                Projects help organize your AI applications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Project Name</label>
                <Input
                  placeholder="My AI Project"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description (Optional)</label>
                <Textarea
                  placeholder="Brief description of your project..."
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  rows={3}
                  disabled={loading}
                />
              </div>

              <Button onClick={createProject} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <FolderOpen className="mr-2 h-4 w-4" />
                    Create Project
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Projects</CardTitle>
              <CardDescription>
                Manage and organize your AI applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No projects yet. Create your first project to get started!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className={`p-4 border rounded-md cursor-pointer transition-colors ${
                        selectedProject?.id === project.id
                          ? 'border-primary bg-accent'
                          : 'hover:bg-accent'
                      }`}
                      onClick={() => setSelectedProject(project)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{project.name}</h3>
                          {project.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {project.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Created {new Date(project.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {selectedProject?.id === project.id && (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
