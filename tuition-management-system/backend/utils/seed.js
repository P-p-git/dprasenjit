const dotenv = require('dotenv');
const path = require('path');
const crypto = require('crypto');
const { db, initializeDatabase } = require('../config/db');
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Batch = require('../models/Batch');
const Fee = require('../models/Fee');
const Notice = require('../models/Notice');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Admin credentials are NEVER hardcoded. They come from environment variables
// (ADMIN_NAME / ADMIN_USERNAME / ADMIN_EMAIL / ADMIN_PASSWORD). If no password
// is configured, a strong random one is generated and printed ONCE so the
// operator can log in and change it.
const resolveAdminCredentials = () => {
  const name = process.env.ADMIN_NAME || 'Administrator';
  const username = process.env.ADMIN_USERNAME || 'admin';
  const email = process.env.ADMIN_EMAIL || 'admin@tms.com';

  let password = process.env.ADMIN_PASSWORD;
  let generated = false;
  if (!password) {
    password = crypto.randomBytes(12).toString('base64url');
    generated = true;
  }
  return { name, username, email, password, generated };
};

const seedDB = async () => {
  try {
    initializeDatabase();

    console.log('Database initialized for seeding...');

    db.exec(`
      DELETE FROM notices;
      DELETE FROM results;
      DELETE FROM fees;
      DELETE FROM attendance;
      DELETE FROM homework;
      DELETE FROM exams;
      DELETE FROM routine;
      DELETE FROM batch_students;
      DELETE FROM students;
      DELETE FROM batches;
      DELETE FROM teachers;
      DELETE FROM users;
    `);
    console.log('Existing data cleared.');

    const adminCreds = resolveAdminCredentials();
    const admin = await User.create({
      name: adminCreds.name,
      username: adminCreds.username,
      email: adminCreds.email,
      password: adminCreds.password,
      role: 'admin',
    });
    if (adminCreds.generated) {
      console.log('\n========================================================');
      console.log('ADMIN PASSWORD (auto-generated, shown only once):');
      console.log(`  Username: ${adminCreds.username}`);
      console.log(`  Password: ${adminCreds.password}`);
      console.log('Store it securely and set ADMIN_PASSWORD next time.');
      console.log('========================================================\n');
    } else {
      console.log(`Admin created: ${adminCreds.username} (password set via ADMIN_PASSWORD env var)`);
    }

    const teacher1 = await Teacher.create({
      name: 'Rahul Sharma',
      email: 'rahul@tms.com',
      phone: '9876543210',
      subject: 'Mathematics',
      qualification: 'M.Sc Mathematics',
    });

    const teacherUser = await User.create({
      name: 'Rahul Sharma',
      username: 'rahul',
      email: 'rahul@tms.com',
      password: 'teacher@123',
      role: 'teacher',
      profileId: teacher1._id,
      profileModel: 'Teacher',
    });
    await Teacher.findByIdAndUpdate(teacher1._id, { userId: teacherUser._id });
    console.log('Teacher created: rahul / teacher@123');

    const batch1 = await Batch.create({
      name: 'Batch A',
      class: '10',
      subject: 'Mathematics',
      teacher: teacher1._id,
      days: ['Monday', 'Wednesday', 'Friday'],
      startTime: '5:00 PM',
      endTime: '6:00 PM',
    });

    const batch2 = await Batch.create({
      name: 'Batch B',
      class: '12',
      subject: 'Physics',
      teacher: teacher1._id,
      days: ['Tuesday', 'Thursday'],
      startTime: '6:00 PM',
      endTime: '7:00 PM',
    });
    console.log('Batches created');

    const studentData = [
      { fullName: 'Amit Kumar', username: 'student01', email: 'amit@tms.com', phone: '9111111111', parentName: 'Rakesh Kumar', parentPhone: '9222222222', class: '10', batch: batch1._id, monthlyFee: 2000 },
      { fullName: 'Priya Singh', username: 'student02', email: 'priya@tms.com', phone: '9333333333', parentName: 'Vikram Singh', parentPhone: '9444444444', class: '10', batch: batch1._id, monthlyFee: 2000 },
      { fullName: 'Sahil Ahmed', username: 'student03', email: 'sahil@tms.com', phone: '9555555555', parentName: 'Nasir Ahmed', parentPhone: '9666666666', class: '12', batch: batch2._id, monthlyFee: 2500 },
      { fullName: 'Neha Gupta', username: 'student04', email: 'neha@tms.com', phone: '9777777777', parentName: 'Sanjay Gupta', parentPhone: '9888888888', class: '12', batch: batch2._id, monthlyFee: 2500 },
    ];

    const students = [];
    for (const data of studentData) {
      const student = await Student.create({
        fullName: data.fullName, email: data.email, phone: data.phone,
        parentName: data.parentName, parentPhone: data.parentPhone,
        class: data.class, batch: data.batch, monthlyFee: data.monthlyFee,
      });
      const user = await User.create({
        name: data.fullName,
        username: data.username,
        email: data.email,
        password: 'student@123',
        role: 'student',
        profileId: student._id,
        profileModel: 'Student',
      });
      await Student.findByIdAndUpdate(student._id, { userId: user._id });
      students.push(await Student.findById(student._id));
    }
    console.log('Students created: student01-04 / student@123');

    await Batch.addStudent(batch1._id, students[0]._id);
    await Batch.addStudent(batch1._id, students[1]._id);
    await Batch.addStudent(batch2._id, students[2]._id);
    await Batch.addStudent(batch2._id, students[3]._id);

    const months = [7, 8];
    for (const student of students) {
      for (const month of months) {
        await Fee.create({
          student: student._id,
          month,
          year: 2026,
          amount: student.monthlyFee,
          status: month === 7 ? 'paid' : 'pending',
          paymentDate: month === 7 ? '2026-07-05' : null,
          paymentMethod: month === 7 ? 'Cash' : '',
        });
      }
    }
    console.log('Fee records created');

    await Notice.create({
      title: 'Welcome to New Session',
      description: 'Classes for the new academic session have started. Please check your batch timings.',
      createdBy: admin._id,
    });
    await Notice.create({
      title: 'Mathematics Test',
      description: 'There will be a Mathematics test next week for Batch A. Prepare well!',
      createdBy: admin._id,
      batch: batch1._id,
    });
    console.log('Notices created');

    console.log('\n--- Seeding Complete ---');
    console.log(`Admin:    ${adminCreds.username} / (see ADMIN_PASSWORD or generated output above)`);
    console.log('Teacher:  rahul / teacher@123');
    console.log('Student:  student01 / student@123');
    console.log('Student:  student02 / student@123');
    console.log('Student:  student03 / student@123');
    console.log('Student:  student04 / student@123');
  } catch (error) {
    throw error;
  }
};

const ensureSeeded = async () => {
  const row = db.prepare('SELECT COUNT(*) AS count FROM users').get();
  if (row.count > 0) {
    return false;
  }
  console.log('Empty database detected - seeding demo data...');
  await seedDB();
  return true;
};

if (require.main === module) {
  seedDB()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Seeding error:', error);
      process.exit(1);
    });
}

module.exports = { seedDB, ensureSeeded };
