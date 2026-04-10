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

interface DynamicFormProps {
  fields: FormFieldConfig[];
  onSubmit: (data: any) => void;
  submitLabel?: string;
  defaultValues?: Record<string, any>;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({ 
  fields, 
  onSubmit, 
  submitLabel = "Submit", 
  defaultValues = {} 
}) => {
  // Create dynamic schema from fields
  const schema = useMemo(() => {
    const shape: Record<string, z.ZodTypeAny> = {};
    fields.forEach((field) => {
      shape[field.name] = field.validation || z.string().min(1, { message: `${field.label} is required` });
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
                    {field.type === 'select' ? (
                      <Select 
                        onValueChange={fieldProps.onChange} 
                        value={value as string}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={field.placeholder || "Select an option"} />
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
                      />
                    ) : (
                      <Input 
                        type={field.type} 
                        placeholder={field.placeholder} 
                        {...fieldProps} 
                        value={(value as string) ?? ""}
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
        <Button type="submit" className="w-full">
          {submitLabel}
        </Button>
      </form>
    </Form>
  );
};
