// src/app/pages/admin/pages/submissions/submissions.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Submission {
  id: string;
  userName: string;
  userEmail: string;
  examTitle: string;
  skill: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  timeSpent: string;
  submittedAt: string;
  status: 'Passed' | 'Failed' | 'In Progress';
}

@Component({
  selector: 'app-submissions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">📊 Submissions</h1>
          <p class="mt-1 text-gray-600">Manage all exam submissions from users.</p>
        </div>
        <div class="flex gap-3">
          <button class="inline-flex items-center rounded-3xl bg-blue-600 px-5 py-3 text-white shadow-sm hover:bg-blue-700 transition">
            📥 Export
          </button>
          <button class="inline-flex items-center rounded-3xl bg-gray-600 px-5 py-3 text-white shadow-sm hover:bg-gray-700 transition">
            🔄 Refresh
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <p class="text-sm text-gray-500">Total Submissions</p>
          <p class="text-2xl font-bold text-blue-600">1,284</p>
        </div>
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <p class="text-sm text-gray-500">Passed</p>
          <p class="text-2xl font-bold text-emerald-600">892</p>
        </div>
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <p class="text-sm text-gray-500">Failed</p>
          <p class="text-2xl font-bold text-red-600">392</p>
        </div>
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <p class="text-sm text-gray-500">Avg Score</p>
          <p class="text-2xl font-bold text-purple-600">6.8</p>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr>
                <th class="px-4 py-3 text-xs font-semibold uppercase text-slate-500">User</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Exam</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Skill</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Score</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Time</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Status</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Submitted</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr *ngFor="let sub of submissions" class="hover:bg-slate-50 transition">
                <td class="px-4 py-4">
                  <div>
                    <p class="font-medium text-gray-900">{{ sub.userName }}</p>
                    <p class="text-xs text-gray-500">{{ sub.userEmail }}</p>
                  </div>
                </td>
                <td class="px-4 py-4 text-gray-700">{{ sub.examTitle }}</td>
                <td class="px-4 py-4">
                  <span class="inline-block px-2 py-1 text-xs font-semibold rounded-full"
                        [class]="getSkillBadge(sub.skill)">
                    {{ sub.skill }}
                  </span>
                </td>
                <td class="px-4 py-4 font-semibold">
                  <span [class]="sub.score >= 7 ? 'text-emerald-600' : 'text-red-600'">
                    {{ sub.score }}/10
                  </span>
                  <span class="text-xs text-gray-400 ml-1">({{ sub.correctCount }}/{{ sub.totalQuestions }})</span>
                </td>
                <td class="px-4 py-4 text-gray-500 text-sm">{{ sub.timeSpent }}</td>
                <td class="px-4 py-4">
                  <span class="inline-block px-3 py-1 text-xs font-semibold rounded-full"
                        [class]="getStatusClass(sub.status)">
                    {{ sub.status }}
                  </span>
                </td>
                <td class="px-4 py-4 text-gray-500 text-sm">{{ sub.submittedAt }}</td>
                <td class="px-4 py-4">
                  <button class="text-blue-600 hover:text-blue-800 text-sm font-medium">View</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class SubmissionsComponent implements OnInit {
  submissions: Submission[] = [];

  ngOnInit() {
    // Mock data
    this.submissions = [
      {
        id: '1',
        userName: 'Nguyễn Văn A',
        userEmail: 'vana@email.com',
        examTitle: 'VSTEP Full Test 2',
        skill: 'Full Test',
        score: 8.5,
        totalQuestions: 35,
        correctCount: 30,
        timeSpent: '45 phút',
        submittedAt: '2026-06-17 14:30',
        status: 'Passed'
      },
      {
        id: '2',
        userName: 'Trần Thị B',
        userEmail: 'thib@email.com',
        examTitle: 'Reading Test 1',
        skill: 'Reading',
        score: 6.0,
        totalQuestions: 35,
        correctCount: 21,
        timeSpent: '52 phút',
        submittedAt: '2026-06-17 13:15',
        status: 'Failed'
      },
      {
        id: '3',
        userName: 'Lê Văn C',
        userEmail: 'vanc@email.com',
        examTitle: 'Writing Test 2',
        skill: 'Writing',
        score: 7.5,
        totalQuestions: 2,
        correctCount: 2,
        timeSpent: '35 phút',
        submittedAt: '2026-06-17 11:00',
        status: 'Passed'
      },
      {
        id: '4',
        userName: 'Phạm Thị D',
        userEmail: 'thid@email.com',
        examTitle: 'Speaking Test 1',
        skill: 'Speaking',
        score: 4.0,
        totalQuestions: 3,
        correctCount: 1,
        timeSpent: '8 phút',
        submittedAt: '2026-06-17 10:20',
        status: 'In Progress'
      }
    ];
  }

  getSkillBadge(skill: string): string {
    const map: Record<string, string> = {
      'Reading': 'bg-blue-100 text-blue-700',
      'Listening': 'bg-green-100 text-green-700',
      'Writing': 'bg-orange-100 text-orange-700',
      'Speaking': 'bg-pink-100 text-pink-700',
      'Full Test': 'bg-purple-100 text-purple-700'
    };
    return map[skill] || 'bg-gray-100 text-gray-700';
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'Passed': 'bg-emerald-100 text-emerald-700',
      'Failed': 'bg-red-100 text-red-700',
      'In Progress': 'bg-yellow-100 text-yellow-700'
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  }
}