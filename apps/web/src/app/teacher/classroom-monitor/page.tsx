'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { RoleGuard } from '@/components/layout/role-guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetcher } from '@/lib/api/fetcher';
import type { ClassroomMonitorData, WritingSessionStatusData } from '@betterwrite/shared';
import { UserRole } from '@betterwrite/shared';
import { Activity, AlertTriangle, CheckCircle2, Clock, RefreshCw, Users, Zap } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

export default function TeacherClassroomMonitorPage() {
  const [classId, setClassId] = useState('');
  const [data, setData] = useState<ClassroomMonitorData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadData = useCallback(async () => {
    if (!classId) return;
    setIsLoading(true);
    try {
      const res = await fetcher.getClassroomMonitor(classId);
      if (res.success && res.data) setData(res.data);
    } finally {
      setIsLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    if (classId) loadData();
  }, [classId, loadData]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!autoRefresh || !classId) return;
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, classId, loadData]);

  const getStatusColor = (session: WritingSessionStatusData) => {
    if (session.status === 'submitted') return 'text-success';
    if (session.isStalled) return 'text-error';
    if (session.writingSpeed < 3) return 'text-warning';
    return 'text-success';
  };

  const getStatusLabel = (session: WritingSessionStatusData) => {
    if (session.status === 'submitted') return '已提交';
    if (session.isStalled) return '停滞';
    if (session.writingSpeed < 3) return '偏慢';
    return '正常';
  };

  return (
    <RoleGuard allowedRoles={[UserRole.TEACHER, UserRole.SCHOOL_ADMIN]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-accent" />
              <h1 className="text-title-24 font-serif font-medium text-neutral-10">课堂写作监控</h1>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-copy-14 text-neutral-7">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="accent-accent"
                />
                自动刷新
              </label>
              <Button variant="ghost" size="sm" onClick={loadData} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Class selector */}
          <div className="flex items-center gap-3">
            <label htmlFor="classId" className="text-copy-14 text-neutral-7">
              选择班级:
            </label>
            <input
              id="classId"
              type="text"
              placeholder="输入班级 ID"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="h-10 w-64 rounded-md ring-1 ring-border bg-paper px-3 text-copy-14 text-neutral-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
          </div>

          {!classId && (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 text-neutral-6 mx-auto mb-3" />
                <p className="text-neutral-8">请输入班级 ID 开始监控</p>
              </CardContent>
            </Card>
          )}

          {classId && data && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Users className="w-5 h-5 text-accent mx-auto mb-1" />
                    <p className="text-title-24 font-medium text-neutral-10">
                      {data.summary.totalStudents}
                    </p>
                    <p className="text-label-12 text-neutral-7">在线学生</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Zap className="w-5 h-5 text-success mx-auto mb-1" />
                    <p className="text-title-24 font-medium text-neutral-10">
                      {data.summary.activeWriters}
                    </p>
                    <p className="text-label-12 text-neutral-7">正在写作</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <CheckCircle2 className="w-5 h-5 text-info mx-auto mb-1" />
                    <p className="text-title-24 font-medium text-neutral-10">
                      {data.summary.submittedCount}
                    </p>
                    <p className="text-label-12 text-neutral-7">已提交</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <AlertTriangle className="w-5 h-5 text-warning mx-auto mb-1" />
                    <p className="text-title-24 font-medium text-neutral-10">
                      {data.summary.stalledCount}
                    </p>
                    <p className="text-label-12 text-neutral-7">停滞超2分钟</p>
                  </CardContent>
                </Card>
              </div>

              {/* Average stats */}
              <div className="flex items-center gap-6 text-copy-14 text-neutral-7">
                <span>
                  平均词数:{' '}
                  <strong className="text-neutral-10">{data.summary.averageWordCount}</strong>
                </span>
                <span>
                  平均速度: <strong className="text-neutral-10">{data.summary.averageSpeed}</strong>{' '}
                  词/分钟
                </span>
              </div>

              {/* Student list */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-title-20">学生写作状态</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.sessions.map((session) => (
                      <div
                        key={session.sessionId}
                        className={`flex items-center justify-between rounded-md p-3 ${
                          session.isStalled ? 'bg-error/5 border border-error/20' : 'bg-neutral-2'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              session.status === 'submitted'
                                ? 'bg-success'
                                : session.isStalled
                                  ? 'bg-error animate-pulse'
                                  : 'bg-accent'
                            }`}
                          />
                          <span className="font-medium text-neutral-10">{session.studentName}</span>
                          <Badge
                            variant="outline"
                            className={`text-label-12 ${getStatusColor(session)}`}
                          >
                            {getStatusLabel(session)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-label-12 text-neutral-7">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {Math.round(session.elapsedTimeMs / 60000)} 分钟
                          </span>
                          <span>{session.currentWordCount} 词</span>
                          <span>{session.writingSpeed.toFixed(1)} 词/分</span>
                        </div>
                      </div>
                    ))}

                    {data.sessions.length === 0 && (
                      <p className="text-center text-neutral-7 py-8">暂无活跃的写作会话</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
