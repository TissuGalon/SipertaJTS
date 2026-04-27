"use client";

import React, { useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from './file-upload';
import { FormFieldConfig } from '@/types';

import { IconLoader2 } from '@tabler/icons-react';

interface DynamicFormProps {
  fields: FormFieldConfig[];
  onSubmit: (data: any) => void;
  submitLabel?: string;
  defaultValues?: Record<string, any>;
  isLoading?: boolean;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({ 
  fields, 
  onSubmit, 
  submitLabel = "Submit", 
  defaultValues = {},
  isLoading = false
}) => {
  // Create dynamic schema from fields
  const schema = useMemo(() => {
    const shape: Record<string, z.ZodTypeAny> = {};
    fields.forEach((field) => {
      if (field.validation) {
        shape[field.name] = field.validation;
      } else if (field.type === 'file') {
        if (field.required === false) {
          shape[field.name] = z.any().optional();
        } else {
          shape[field.name] = z.array(z.any()).min(1, { message: `${field.label} wajib diisi` });
        }
      } else if (field.required === false) {
        shape[field.name] = z.any().optional();
      } else {
        // Default to required string
        shape[field.name] = z.string().min(1, { message: `${field.label} wajib diisi` });
      }
    });
    return z.object(shape);
  }, [fields]);

  type FormValues = z.infer<typeof schema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {fields.map((field) => (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field: formField }) => {
              const { value, ...fieldProps } = formField;
              return (
                <FormItem className="space-y-2">
                  <FormLabel className="text-xs font-black uppercase tracking-wider text-slate-500 ml-1">{field.label}</FormLabel>
                  <FormControl>
                    {field.type === 'select' || field.type === 'dosen_picker' ? (
                      <Select 
                        onValueChange={fieldProps.onChange} 
                        value={value as string}
                        disabled={field.disabled}
                      >
                        <SelectTrigger className="h-12 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium">
                          <SelectValue placeholder={field.placeholder || (field.type === 'dosen_picker' ? "Pilih Dosen..." : "Select an option")} />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 dark:border-slate-800 shadow-2xl">
                          {field.options?.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="rounded-lg m-1">
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : field.type === 'file' ? (
                      <FileUpload onFilesChange={(files) => fieldProps.onChange(files)} />
                    ) : field.type === 'textarea' ? (
                      <Textarea
                        placeholder={field.placeholder}
                        {...fieldProps}
                        value={(value as string) ?? ""}
                        disabled={field.disabled}
                        className="min-h-[120px] bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none"
                      />
                    ) : (
                      <Input 
                        type={field.type} 
                        placeholder={field.placeholder} 
                        {...fieldProps} 
                        value={(value as string) ?? ""}
                        disabled={field.disabled}
                        className="h-12 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium disabled:bg-slate-50 dark:disabled:bg-slate-900/80 disabled:text-slate-400"
                      />
                    )}
                  </FormControl>
                  {field.description && <FormDescription className="text-[11px] ml-1">{field.description}</FormDescription>}
                  <FormMessage className="text-xs font-bold" />
                </FormItem>
              );
            }}
          />
        ))}
        <Button 
          type="submit" 
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/20 dark:shadow-none font-black h-14 rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99] text-base uppercase tracking-wider mt-4" 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <IconLoader2 className="mr-2 h-5 w-5 animate-spin" />
              Memproses...
            </>
          ) : submitLabel}
        </Button>
      </form>
    </Form>
  );
};
