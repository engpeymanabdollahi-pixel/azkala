import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import toast from 'react-hot-toast';

// Types
export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'boolean' | 'email' | 'password';
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string | number }[];
  validation?: z.ZodType<any>;
  defaultValue?: any;
}

interface ModalFormProps<T extends z.ZodType<any>> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: FieldConfig[];
  schema: T;
  defaultValues?: z.infer<T>;
  onSubmit: (data: z.infer<T>) => Promise<void>;
  isLoading?: boolean;
}

export function ModalForm<T extends z.ZodType<any>>({
  open,
  onOpenChange,
  title,
  description,
  fields,
  schema,
  defaultValues,
  onSubmit,
  isLoading = false,
}: ModalFormProps<T>) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const handleFormSubmit = async (data: z.infer<T>) => {
    try {
      await onSubmit(data);
      toast.success('عملیات با موفقیت انجام شد');
      reset();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'خطا در انجام عملیات');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>

                {field.type === 'text' || field.type === 'email' || field.type === 'password' ? (
                  <Input
                    id={field.name}
                    type={field.type}
                    placeholder={field.placeholder}
                    {...register(field.name)}
                  />
                ) : field.type === 'textarea' ? (
                  <Textarea
                    id={field.name}
                    placeholder={field.placeholder}
                    {...register(field.name)}
                  />
                ) : field.type === 'number' ? (
                  <Input
                    id={field.name}
                    type="number"
                    placeholder={field.placeholder}
                    {...register(field.name, { valueAsNumber: true })}
                  />
                ) : field.type === 'select' ? (
                  <Controller
                    name={field.name}
                    control={control}
                    render={({ field: controllerField }) => (
                      <Select
                        value={String(controllerField.value || '')}
                        onValueChange={controllerField.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={field.placeholder || 'انتخاب کنید'} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((option) => (
                            <SelectItem key={option.value} value={String(option.value)}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                ) : field.type === 'boolean' ? (
                  <Controller
                    name={field.name}
                    control={control}
                    render={({ field: controllerField }) => (
                      <Checkbox
                        id={field.name}
                        checked={controllerField.value}
                        onCheckedChange={controllerField.onChange}
                      />
                    )}
                  />
                ) : null}

                {errors[field.name] && (
                  <p className="text-sm text-red-500">
                    {errors[field.name]?.message as string}
                  </p>
                )}
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              انصراف
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'در حال ارسال...' : 'ذخیره'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}