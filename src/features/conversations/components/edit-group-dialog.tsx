'use client';

import { useEffect, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImagePlus, Pencil, UsersRound, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { GroupConversation } from '../types';
import { useGroupActions } from '../hooks/use-group-actions';

interface EditGroupDialogProps {
  conversation: GroupConversation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_AVATAR_SIZE = 50 * 1024 * 1024;
const editGroupSchema = z.object({
  name: z.string().trim().min(1, 'Enter a group name.').max(100, 'Use 100 characters or fewer.'),
});

type EditGroupFormValues = z.infer<typeof editGroupSchema>;
type SubmissionStage = 'idle' | 'uploading' | 'saving';

interface AvatarSelection {
  file: File;
  previewUrl: string;
}

export const EditGroupDialog = ({
  conversation,
  open,
  onOpenChange,
}: EditGroupDialogProps) => {
  const [avatarSelection, setAvatarSelection] = useState<AvatarSelection>();
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string>();
  const [avatarError, setAvatarError] = useState<string>();
  const [submissionStage, setSubmissionStage] = useState<SubmissionStage>('idle');
  const avatarPreviewUrlRef = useRef<string | undefined>(undefined);
  const { isAdmin, isUpdatePending, updateGroupInfo, uploadGroupAvatar } =
    useGroupActions(conversation);
  const form = useForm<EditGroupFormValues>({
    resolver: zodResolver(editGroupSchema),
    defaultValues: { name: conversation.name },
  });
  const isBusy = submissionStage !== 'idle' || isUpdatePending;

  useEffect(
    () => () => {
      if (avatarPreviewUrlRef.current) {
        URL.revokeObjectURL(avatarPreviewUrlRef.current);
      }
    },
    [],
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (isBusy) return;
    onOpenChange(nextOpen);
  };

  const handleAvatarChange = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAvatarError('Choose an image file.');
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setAvatarError('The avatar must be 50 MB or smaller.');
      return;
    }

    if (avatarPreviewUrlRef.current) {
      URL.revokeObjectURL(avatarPreviewUrlRef.current);
    }
    const previewUrl = URL.createObjectURL(file);
    avatarPreviewUrlRef.current = previewUrl;
    setAvatarError(undefined);
    setAvatarSelection({ file, previewUrl });
    setUploadedAvatarUrl(undefined);
  };

  const clearAvatarSelection = () => {
    if (avatarPreviewUrlRef.current) {
      URL.revokeObjectURL(avatarPreviewUrlRef.current);
      avatarPreviewUrlRef.current = undefined;
    }
    setAvatarSelection(undefined);
    setUploadedAvatarUrl(undefined);
    setAvatarError(undefined);
  };

  const handleSubmit = async (values: EditGroupFormValues) => {
    if (!isAdmin) {
      toast.error('Only group admins can update group details.');
      return;
    }

    let avatarUrl = uploadedAvatarUrl;

    if (avatarSelection && !avatarUrl) {
      setSubmissionStage('uploading');
      try {
        avatarUrl = await uploadGroupAvatar(avatarSelection.file);
        setUploadedAvatarUrl(avatarUrl);
      } catch (error) {
        setSubmissionStage('idle');
        toast.error(error instanceof Error ? error.message : 'Could not upload the group avatar.');
        return;
      }
    }

    setSubmissionStage('saving');
    try {
      await updateGroupInfo({
        name: values.name.trim(),
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      });
      setSubmissionStage('idle');
      onOpenChange(false);
    } catch {
      setSubmissionStage('idle');
      // The mutation hook shows the API error. Keep uploadedAvatarUrl for a PATCH-only retry.
    }
  };

  const submitLabel =
    submissionStage === 'uploading'
      ? 'Uploading image…'
      : submissionStage === 'saving' || isUpdatePending
        ? 'Saving…'
        : 'Save changes';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden border border-[#2f3336] bg-[#121212] p-0 text-white shadow-2xl">
        <DialogHeader className="border-b border-[#2f3336] px-5 py-4 pr-12">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#181818]">
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0 pt-0.5">
              <DialogTitle className="text-lg font-bold">Edit group</DialogTitle>
              <DialogDescription className="mt-1 text-sm leading-5 text-gray-400">
                Update the name or choose a new group avatar.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5 px-5 py-5">
          <div>
            <label htmlFor={`edit-group-name-${conversation._id}`} className="mb-2 block text-sm font-semibold">
              Group name
            </label>
            <input
              id={`edit-group-name-${conversation._id}`}
              {...form.register('name')}
              maxLength={100}
              disabled={isBusy}
              aria-invalid={Boolean(form.formState.errors.name)}
              className="h-11 w-full rounded-xl border border-[#2f3336] bg-black px-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-[#536471] focus:ring-2 focus:ring-white disabled:opacity-50"
            />
            {form.formState.errors.name && (
              <p className="mt-1.5 text-xs text-red-400">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <span className="mb-2 block text-sm font-semibold">Group avatar</span>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[#181818] ring-1 ring-white/10">
                {avatarSelection?.previewUrl || conversation.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarSelection?.previewUrl || conversation.avatar_url}
                    alt={avatarSelection ? 'Selected group avatar preview' : ''}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center">
                    <UsersRound className="h-5 w-5 text-gray-500" aria-hidden="true" />
                  </span>
                )}
              </div>
              <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-[#536471] px-4 text-sm font-semibold transition-colors duration-200 hover:bg-[#181818] focus-within:ring-2 focus-within:ring-white">
                <ImagePlus className="h-4 w-4" aria-hidden="true" />
                Choose image
                <input
                  type="file"
                  accept="image/*"
                  disabled={isBusy}
                  onChange={(event) => handleAvatarChange(event.target.files?.[0])}
                  className="sr-only"
                />
              </label>
              {avatarSelection && (
                <button
                  type="button"
                  onClick={clearAvatarSelection}
                  disabled={isBusy}
                  aria-label="Remove selected group avatar"
                  className="rounded-full p-2 text-gray-400 hover:bg-[#181818] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
            {avatarSelection && (
              <p className="mt-2 truncate text-xs text-gray-500">{avatarSelection.file.name}</p>
            )}
            {uploadedAvatarUrl && (
              <p role="status" className="mt-1.5 text-xs text-gray-400">
                Image uploaded. Retrying will reuse it if saving fails.
              </p>
            )}
            {avatarError && <p className="mt-1.5 text-xs text-red-400">{avatarError}</p>}
          </div>

          <div className="flex justify-end gap-3 border-t border-[#2f3336] pt-4">
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              disabled={isBusy}
              className="rounded-full px-4 py-2 text-sm font-semibold hover:bg-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isBusy || !isAdmin}
              className="rounded-full bg-white px-5 py-2 text-sm font-bold text-black hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
