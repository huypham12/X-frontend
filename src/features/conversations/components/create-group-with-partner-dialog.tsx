'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImagePlus, LockKeyhole, UsersRound, X } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCreateGroupConversation } from '../hooks/use-create-group-conversation';
import type { CreateGroupPartner } from '../types/create-group.type';
import { CreateGroupMemberPicker } from './create-group-member-picker';

interface CreateGroupWithPartnerDialogProps {
  open: boolean;
  partner: CreateGroupPartner;
  onOpenChange: (open: boolean) => void;
}

const MAX_AVATAR_SIZE = 50 * 1024 * 1024;
const createGroupSchema = z.object({
  name: z.string().trim().min(1, 'Enter a group name.').max(100, 'Use 100 characters or fewer.'),
  memberIds: z.array(z.string()).min(1, 'Select at least one additional person.'),
});

type CreateGroupFormValues = z.infer<typeof createGroupSchema>;

export const CreateGroupWithPartnerDialog = ({
  open,
  partner,
  onOpenChange,
}: CreateGroupWithPartnerDialogProps) => {
  const [avatarFile, setAvatarFile] = useState<File | undefined>();
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const createGroupMutation = useCreateGroupConversation();
  const form = useForm<CreateGroupFormValues>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: { name: '', memberIds: [] },
  });
  const selectedMemberIds = useWatch({ control: form.control, name: 'memberIds' });

  const resetDialog = () => {
    form.reset();
    setAvatarFile(undefined);
    setAvatarError(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (createGroupMutation.isPending) return;
    if (!nextOpen) resetDialog();
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
    setAvatarError(null);
    setAvatarFile(file);
  };

  const handleSubmit = async (values: CreateGroupFormValues) => {
    try {
      await createGroupMutation.mutateAsync({
        name: values.name,
        members: [partner._id, ...values.memberIds],
        avatarFile,
      });
    } catch {
      // Mutation feedback is shown by the hook; keep the form intact for retry.
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[min(90dvh,720px)] max-w-lg flex-col gap-0 overflow-hidden border border-[#2f3336] bg-[#121212] p-0 text-white shadow-2xl">
        <DialogHeader className="shrink-0 border-b border-[#2f3336] px-5 py-4 pr-12">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#181818]">
              <UsersRound className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0 pt-0.5">
              <DialogTitle className="text-lg font-bold">Create a group</DialogTitle>
              <DialogDescription className="mt-1 text-sm leading-5 text-gray-400">
                {partner.name} is already selected. Add at least one more person.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="custom-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
            <div>
              <label htmlFor="create-group-name" className="mb-1.5 block text-sm font-semibold">
                Group name
              </label>
              <input
                id="create-group-name"
                {...form.register('name')}
                maxLength={100}
                placeholder="Name your group"
                disabled={createGroupMutation.isPending}
                aria-invalid={Boolean(form.formState.errors.name)}
                className="h-10 w-full rounded-xl border border-[#2f3336] bg-black px-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-[#536471] focus:ring-2 focus:ring-white disabled:opacity-50"
              />
              {form.formState.errors.name && (
                <p className="mt-1.5 text-xs text-red-400">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div>
              <span className="mb-1.5 block text-sm font-semibold">Group avatar (optional)</span>
              <div className="flex items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#536471] px-3 py-2 text-sm font-semibold transition-colors duration-200 hover:bg-[#181818] focus-within:ring-2 focus-within:ring-white">
                  <ImagePlus className="h-4 w-4" aria-hidden="true" />
                  Choose image
                  <input
                    type="file"
                    accept="image/*"
                    disabled={createGroupMutation.isPending}
                    onChange={(event) => handleAvatarChange(event.target.files?.[0])}
                    className="sr-only"
                  />
                </label>
                {avatarFile && (
                  <button
                    type="button"
                    onClick={() => setAvatarFile(undefined)}
                    disabled={createGroupMutation.isPending}
                    aria-label="Remove selected group avatar"
                    className="rounded-full p-2 text-gray-400 hover:bg-[#181818] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
              {avatarFile && <p className="mt-2 truncate text-xs text-gray-500">{avatarFile.name}</p>}
              {avatarError && <p className="mt-1.5 text-xs text-red-400">{avatarError}</p>}
            </div>

            <div>
              <span className="mb-1.5 block text-sm font-semibold">Members</span>
              <div className="flex items-center gap-3 rounded-xl bg-[#181818] px-3 py-2">
                <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[#2f3336]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={partner.avatar || '/default-avatar.png'} alt="" className="h-full w-full object-cover" />
                </div>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{partner.name}</span>
                  {partner.username && <span className="block truncate text-xs text-gray-500">@{partner.username}</span>}
                </span>
                <LockKeyhole className="h-4 w-4 shrink-0 text-gray-500" aria-label="Selected member" />
              </div>
            </div>

            <CreateGroupMemberPicker
              partnerId={partner._id}
              selectedMemberIds={selectedMemberIds}
              disabled={createGroupMutation.isPending}
              onChange={(memberIds) =>
                form.setValue('memberIds', memberIds, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />

            {form.formState.errors.memberIds && (
              <p className="text-xs text-red-400">{form.formState.errors.memberIds.message}</p>
            )}
            <p className="text-xs text-gray-500">
              {selectedMemberIds.length + 2} members including you
            </p>
          </div>

          <div className="flex shrink-0 justify-end gap-3 border-t border-[#2f3336] bg-[#121212] px-5 py-3.5">
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              disabled={createGroupMutation.isPending}
              className="rounded-full px-4 py-2 text-sm font-semibold text-white hover:bg-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createGroupMutation.isPending}
              className="rounded-full bg-white px-5 py-2 text-sm font-bold text-black transition-colors duration-200 hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createGroupMutation.isPending ? 'Creating…' : 'Create group'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
