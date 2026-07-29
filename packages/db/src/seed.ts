import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { db } from './index.js';
import { classEnrollments, classes, essayTasks, schools, users } from './schema/index.js';

function generateRandomPassword(length = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

async function seed() {
  console.log('🌱 Seeding database...');

  const now = new Date().toISOString();
  const superAdminPassword = generateRandomPassword();
  const schoolAdminPassword = generateRandomPassword();
  const teacherPassword = generateRandomPassword();
  const studentPassword = generateRandomPassword();

  const superAdminHash = await bcrypt.hash(superAdminPassword, 10);
  const schoolAdminHash = await bcrypt.hash(schoolAdminPassword, 10);
  const teacherHash = await bcrypt.hash(teacherPassword, 10);
  const studentHash = await bcrypt.hash(studentPassword, 10);

  const schoolId = randomUUID();
  const seniorSchoolId = randomUUID();
  const superAdminId = randomUUID();
  const schoolAdminId = randomUUID();
  const seniorSchoolAdminId = randomUUID();
  const teacherId = randomUUID();
  const seniorTeacherId = randomUUID();
  const studentId = randomUUID();
  const seniorStudentId = randomUUID();
  const classId = randomUUID();
  const seniorClassId = randomUUID();

  // 事务包裹所有写入，任一步失败则整体回滚，避免残留残缺数据。
  await db.transaction(async (tx) => {
    await tx.insert(schools).values([
      {
        id: schoolId,
        code: 'SZFTSYZX',
        name: '深圳市福田区实验中学',
        region: '福田',
        stage: 'junior',
        contactName: '王校长',
        contactPhone: '13800138000',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: seniorSchoolId,
        code: 'GDHSFZ',
        name: '广东华南师范大学附属高中',
        region: '广东',
        stage: 'senior',
        contactName: '陈校长',
        contactPhone: '13900139000',
        createdAt: now,
        updatedAt: now,
      },
    ]);

    await tx.insert(users).values([
      {
        id: superAdminId,
        email: 'superadmin@betterwrite.cn',
        passwordHash: superAdminHash,
        name: '超级管理员',
        role: 'super_admin',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: schoolAdminId,
        email: 'admin@school.com',
        passwordHash: schoolAdminHash,
        name: '学校管理员',
        role: 'school_admin',
        schoolId,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: seniorSchoolAdminId,
        email: 'admin@senior.com',
        passwordHash: schoolAdminHash,
        name: '高中学校管理员',
        role: 'school_admin',
        schoolId: seniorSchoolId,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: teacherId,
        email: 'teacher@school.com',
        passwordHash: teacherHash,
        name: '张老师',
        role: 'teacher',
        schoolId,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: seniorTeacherId,
        email: 'teacher@senior.com',
        passwordHash: teacherHash,
        name: '刘老师',
        role: 'teacher',
        schoolId: seniorSchoolId,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: studentId,
        email: 'student@school.com',
        passwordHash: studentHash,
        name: '李同学',
        role: 'student',
        schoolId,
        studentNo: '20250101',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: seniorStudentId,
        email: 'student@senior.com',
        passwordHash: studentHash,
        name: '王同学',
        role: 'student',
        schoolId: seniorSchoolId,
        studentNo: '20250201',
        createdAt: now,
        updatedAt: now,
      },
    ]);

    await tx.insert(classes).values([
      {
        id: classId,
        schoolId,
        code: '2025-C3-01',
        name: '初三(1)班',
        grade: '初三',
        stage: 'junior',
        teacherId,
        academicYear: '2025-2026',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: seniorClassId,
        schoolId: seniorSchoolId,
        code: '2025-H3-01',
        name: '高三(1)班',
        grade: '高三',
        stage: 'senior',
        teacherId: seniorTeacherId,
        academicYear: '2025-2026',
        createdAt: now,
        updatedAt: now,
      },
    ]);

    await tx.insert(classEnrollments).values([
      { id: randomUUID(), classId, userId: teacherId, role: 'teacher', createdAt: now },
      { id: randomUUID(), classId, userId: studentId, role: 'student', createdAt: now },
      {
        id: randomUUID(),
        classId: seniorClassId,
        userId: seniorTeacherId,
        role: 'teacher',
        createdAt: now,
      },
      {
        id: randomUUID(),
        classId: seniorClassId,
        userId: seniorStudentId,
        role: 'student',
        createdAt: now,
      },
    ]);

    await tx.insert(essayTasks).values([
      {
        id: randomUUID(),
        classId,
        createdBy: teacherId,
        title: '给学弟学妹的初中生活建议',
        topicType: '书信',
        topicCategory: '校园生活',
        requirements:
          '假设你是李华，即将初中毕业。请给初一学弟学妹写一封信，分享你的初中生活经验并提出建议。词数80-125。',
        keyPoints: JSON.stringify(['表达祝福', '分享一条经验', '提出两点建议', '表达期望']),
        wordLimitMin: 80,
        wordLimitMax: 125,
        timeLimitMinutes: 15,
        status: 'published',
        stage: 'junior',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: now,
        updatedAt: now,
      },
      {
        id: randomUUID(),
        classId: seniorClassId,
        createdBy: seniorTeacherId,
        title: '给外国朋友写一封关于中国文化的邮件',
        topicType: '书信',
        topicCategory: '文化习俗',
        requirements:
          '假设你是李华，你的外国朋友Tom对中国文化很感兴趣。请给他写一封邮件，介绍一种中国文化（如节日、美食、传统艺术等），并邀请他来中国体验。词数100左右。',
        keyPoints: JSON.stringify(['介绍一种中国文化', '说明其特点或意义', '发出邀请']),
        wordLimitMin: 80,
        wordLimitMax: 120,
        timeLimitMinutes: 20,
        status: 'published',
        stage: 'senior',
        seniorEssayType: 'applied_writing',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: now,
        updatedAt: now,
      },
      {
        id: randomUUID(),
        classId: seniorClassId,
        createdBy: seniorTeacherId,
        title: '读后续写：一次意外的帮助',
        topicType: '记叙文',
        topicCategory: '成长励志',
        requirements:
          '阅读下面短文，根据所给情节进行续写，使之构成一个完整的故事。续写词数应为150左右。',
        keyPoints: JSON.stringify([
          '情节与原文连贯',
          '使用至少3个高级词汇或复杂句式',
          '有积极的主题升华',
        ]),
        wordLimitMin: 120,
        wordLimitMax: 180,
        timeLimitMinutes: 25,
        status: 'published',
        stage: 'senior',
        seniorEssayType: 'continuation_writing',
        readingPassage:
          'Last weekend, I was walking home from the library when I saw an old man sitting on a bench by the road. He looked lost and confused. I approached him and asked if he needed help. He told me that he had forgotten the way to his home...',
        continuationParagraphStarts: JSON.stringify([
          'Paragraph 1: I decided to help him find his way home.',
          'Paragraph 2: The next day, I received an unexpected visitor.',
        ]),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: now,
        updatedAt: now,
      },
    ]);
  });

  console.log('✅ Seed completed');
  console.log(`  Super Admin: superadmin@betterwrite.cn / ${superAdminPassword}`);
  console.log(`  Junior School Admin: admin@school.com / ${schoolAdminPassword}`);
  console.log(`  Senior School Admin: admin@senior.com / ${schoolAdminPassword}`);
  console.log(`  Junior Teacher: teacher@school.com / ${teacherPassword}`);
  console.log(`  Senior Teacher: teacher@senior.com / ${teacherPassword}`);
  console.log(`  Junior Student: student@school.com / ${studentPassword}`);
  console.log(`  Senior Student: student@senior.com / ${studentPassword}`);
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
