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
                <FormItem>
                  <FormLabel>{field.label}</FormLabel>
                  <FormControl>
                    {field.type === 'select' || field.type === 'dosen_picker' ? (
                      <Select 
                        onValueChange={fieldProps.onChange} 
                        value={value as string}
                        disabled={field.disabled}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={field.placeholder || (field.type === 'dosen_picker' ? "Pilih Dosen..." : "Select an option")} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
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
                      />
                    ) : (
                      <Input 
                        type={field.type} 
                        placeholder={field.placeholder} 
                        {...fieldProps} 
                        value={(value as string) ?? ""}
                        disabled={field.disabled}
                      />
                    )}
                  </FormControl>
                  {field.description && <FormDescription>{field.description}</FormDescription>}
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        ))}
        <Button 
          type="submit" 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 dark:shadow-none font-bold h-12 rounded-2xl transition-all" 
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
