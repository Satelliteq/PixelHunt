import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/lib/LanguageContext';
import { Github, Mail, Twitter } from 'lucide-react';

const contactFormSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalıdır'),
  email: z.string().email('Geçerli bir e-posta adresi girin'),
  message: z.string().min(10, 'Mesaj en az 10 karakter olmalıdır'),
});

const TeamMember = ({ 
  name, 
  role, 
  imageUrl, 
  github, 
  twitter, 
  email 
}: { 
  name: string;
  role: string;
  imageUrl: string;
  github?: string;
  twitter?: string;
  email?: string;
}) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex flex-col items-center text-center">
        <div className="relative w-32 h-32 mb-4">
          <img
            src={imageUrl}
            alt={name}
            className="rounded-full object-cover w-full h-full"
          />
        </div>
        <h3 className="text-lg font-semibold">{name}</h3>
        <p className="text-sm text-muted-foreground mb-4">{role}</p>
        <div className="flex space-x-3">
          {github && (
            <a
              href={github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="h-5 w-5" />
            </a>
          )}
          {twitter && (
            <a
              href={twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Twitter className="h-5 w-5" />
            </a>
          )}
          {email && (
            <a
              href={`mailto:${email}`}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail className="h-5 w-5" />
            </a>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function Contact() {
  const { t } = useLanguage();
  const form = useForm<z.infer<typeof contactFormSchema>>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      message: '',
    },
  });

  const onSubmit = (data: z.infer<typeof contactFormSchema>) => {
    console.log(data);
    toast({
      title: 'Mesajınız alındı',
      description: 'En kısa sürede size dönüş yapacağız.',
    });
    form.reset();
  };

  const teamMembers = [
    {
      name: 'Emirhan Sevimli',
      role: 'Kurucu & Yazılım Geliştirici',
      imageUrl: '/images/team/emirhan.jpg',
      github: 'https://github.com/emirhansevimli',
      twitter: 'https://twitter.com/emirhansevimli',
      email: 'emirhan@pixelhunt.com',
    },
    {
      name: 'Yusuf Yeşilyaprak',
      role: 'Kurucu & Yazılım İçerik Yöneticisi ve Geliştiricisi',
      imageUrl: '/images/team/yusuf.jpg',
      github: 'https://github.com/yusufyesilyaprak',
      twitter: 'https://twitter.com/yusufyesilyaprak',
      email: 'yusuf@pixelhunt.com',
    },
    {
      name: 'Nizam Vural',
      role: 'Köstek',
      imageUrl: '/images/team/nizam.jpg',
      github: 'https://github.com/nizamvural',
      twitter: 'https://twitter.com/nizamvural',
      email: 'nizam@pixelhunt.com',
    },
  ];

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-2">Ekibimiz</h1>
        <p className="text-muted-foreground">
          Pixelhunt'ı geliştiren harika ekiple tanışın
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-16">
        {teamMembers.map((member) => (
          <TeamMember key={member.name} {...member} />
        ))}
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Bize Ulaşın</CardTitle>
          <CardDescription>
            Sorularınız, önerileriniz veya geri bildirimleriniz için bize mesaj gönderin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>İsim</FormLabel>
                    <FormControl>
                      <Input placeholder="İsminiz" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-posta</FormLabel>
                    <FormControl>
                      <Input placeholder="E-posta adresiniz" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mesaj</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Mesajınızı buraya yazın..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Gönder
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}