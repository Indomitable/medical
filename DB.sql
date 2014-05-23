create table Title 
(
  Id int identity(1,1) primary key,
  Abr nvarchar(10) not null,
  Description nvarchar(50) not null
);

insert into dbo.Title(Abr, Description)
values ('док.', 'Доктор');
insert into dbo.Title(Abr, Description)
values ('доц.', 'Доцент');
insert into dbo.Title(Abr, Description)
values ('проф.', 'Професор');

create table Speciality
(
  Id int IDENTITY(1, 1) primary key,
  Description nvarchar(250) not null
);

create table Doctor
(
  Id int IDENTITY(1, 1) primary key,
  TitleId int not null,
  FirstName nvarchar(100) not null,
  LastName nvarchar(100) not null,
  DefaultExamTime int default(20) not null,
  constraint Doctor_Title_FK foreign key (TitleId) references  Title(Id),
);

create table DoctorSpeciality
(
  SpecialityId int not null,
  DoctorId int not null,
  constraint DoctorSpeciality_PK primary key(SpecialityId, DoctorId),
  constraint DoctorSpeciality_Speciality_FK foreign key (SpecialityId) references  Speciality(Id) on delete cascade,
  constraint DoctorSpeciality_Doctor_FK foreign key (DoctorId) references  Doctor(Id) on delete cascade
);

insert into Doctor(TitleId, FirstName, LastName)
values(1, 'Венцислав', 'Младенов');

create table Schedule
(
  Id int IDENTITY(1, 1) primary key,
  DoctorId int not null,
  Date datetime not null,
  Note nvarchar(1000),
  constraint Schedule_Doctor_FK foreign key (DoctorId) references  Doctor(Id) on delete cascade
);

create table ScheduleDate
(
  Id int IDENTITY(1, 1) primary key,
  ScheduleId int not null,
  FromTime time not null,
  ToTime time not null,
  IsNZOK bit default(0) not null,
  constraint ScheduleDate_Schedule_FK foreign key (ScheduleId) references  Schedule(Id) on delete cascade
);

