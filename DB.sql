use medical;

/* Drop tables */

IF (EXISTS (select 1 from sys.tables where [name] = 'DoctorSpeciality')) 
  DROP TABLE DoctorSpeciality;

IF (EXISTS (select 1 from sys.tables where [name] = 'Speciality')) 
  DROP TABLE Speciality;

IF (EXISTS (select 1 from sys.tables where [name] = 'ScheduleDate')) 
  DROP TABLE ScheduleDate;

IF (EXISTS (select 1 from sys.tables where [name] = 'Schedule')) 
  DROP TABLE Schedule;

IF (EXISTS (select 1 from sys.tables where [name] = 'PatientPhone')) 
  DROP TABLE PatientPhone;

IF (EXISTS (select 1 from sys.tables where [name] = 'PhoneType')) 
  DROP TABLE PhoneType;
  
IF (EXISTS (select 1 from sys.tables where [name] = 'Reservation')) 
  DROP TABLE Reservation;

IF (EXISTS (select 1 from sys.tables where [name] = 'PaymentInfo')) 
  DROP TABLE PaymentInfo;

IF (EXISTS (select 1 from sys.tables where [name] = 'PaymentType')) 
  DROP TABLE PaymentType;  

IF (EXISTS (select 1 from sys.tables where [name] = 'PatientFundInfo')) 
  DROP TABLE PatientFundInfo;

IF (EXISTS (select 1 from sys.tables where [name] = 'Patient')) 
  DROP TABLE Patient;  

IF (EXISTS (select 1 from sys.tables where [name] = 'IdentificationNumberType')) 
  DROP TABLE IdentificationNumberType;  

IF (EXISTS (select 1 from sys.tables where [name] = 'Fund')) 
  DROP TABLE Fund;

IF (EXISTS (select 1 from sys.tables where [name] = 'Gender')) 
  DROP TABLE Gender; 

 IF (EXISTS (select 1 from sys.tables where [name] = 'ReservationLock')) 
  DROP TABLE ReservationLock;

IF (EXISTS (select 1 from sys.tables where [name] = 'Doctor')) 
  DROP TABLE Doctor;

IF (EXISTS (select 1 from sys.tables where [name] = 'Title')) 
  DROP TABLE Title;

IF (EXISTS (select 1 from sys.tables where [name] = 'RoleUser')) 
  DROP TABLE RoleUser; 

IF (EXISTS (select 1 from sys.tables where [name] = 'Role ')) 
  DROP TABLE Role;

IF (EXISTS (select 1 from sys.tables where [name] = 'User')) 
  DROP TABLE [User];

IF (EXISTS (select 1 from sys.tables where [name] = 'ReservationLog')) 
  DROP TABLE ReservationLog;

/* Create tables */

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

insert into Speciality ([Description])
values('Кардиолог');
insert into Speciality ([Description])
values('Пулмолог');
insert into Speciality ([Description])
values('Ортопед');
insert into Speciality ([Description])
values('Уши Нос Гърло');
insert into Speciality ([Description])
values('Дерматолог');
insert into Speciality ([Description])
values('Невролог');

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
  Date date not null,
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

create table Fund
(
  Id int,
  Name nvarchar(MAX) not null,
  constraint Fund_PK primary key (Id)
);

INSERT INTO Fund (Id, Name) VALUES (0, 'No Fund');
INSERT INTO Fund (Id, Name) VALUES (1, 'ДЗИ');
INSERT INTO Fund (Id, Name) VALUES (2, 'България Здраве');
INSERT INTO Fund (Id, Name) VALUES (3, 'Медико');

create table IdentificationNumberType
(
  Id INT NOT NULL,
  Type VARCHAR(50) NOT NULL,
  CONSTRAINT IdentificationNumberType_PK PRIMARY KEY (Id)
);

INSERT INTO IdentificationNumberType (Id, [Type])
VALUES (1, 'ЕГН');
INSERT INTO IdentificationNumberType (Id, [Type])
VALUES (2, 'ЛНЧ');
INSERT INTO IdentificationNumberType (Id, [Type])
VALUES (3, 'Частично ЕГН');

create table Gender
(
  Id INT NOT NULL,
  Type VARCHAR(10) NOT NULL,
  CONSTRAINT Gender_PK PRIMARY KEY (Id)
);

INSERT INTO Gender (Id, [Type])
VALUES (1, 'Мъж');
INSERT INTO Gender (Id, [Type])
VALUES (2, 'Жена');



create table Patient
(
  Id int identity(1, 1),
  FirstName nvarchar(100) not null,
  MiddleName nvarchar(100) null,
  LastName nvarchar(100) not null,
  IdentNumber nvarchar(100) null,
  IdentNumberTypeId int default(1) not null,
  GenderId int default(1) not null,
  Email nvarchar(100) null,
  Town nvarchar(100) null,
  PostCode nvarchar(50) null,
  Address nvarchar(300) null,
  Note nvarchar(max) null,
  constraint Patient_PK primary key (Id),
  constraint Patient_IdentificationNumberType_FK foreign key (IdentNumberTypeId) references IdentificationNumberType(Id),
  constraint Patient_Gender_FK foreign key (GenderId) references Gender(Id)
);

create table PatientFundInfo
(
  PatientId int,
  FundId int not null,
  FundCardNumber nvarchar(50) not null,
  FundCardExpiration date not null,
  constraint FundInfo_PK primary key (PatientId),
  constraint FundInfo_Fund_FK foreign key (FundId) references Fund(Id),
  constraint FundInfo_Patient_FK foreign key (PatientId) references Patient(Id)
);

CREATE TABLE PhoneType 
(
  Id INT NOT NULL,
  Type VARCHAR(10) NOT NULL,
  CONSTRAINT PhoneType_PK PRIMARY KEY (Id)
);

INSERT INTO PhoneType (Id, [Type])
VALUES (0, 'Other');
INSERT INTO PhoneType (Id, [Type])
VALUES (1, 'Home');
INSERT INTO PhoneType (Id, [Type])
VALUES (2, 'Work');
INSERT INTO PhoneType (Id, [Type])
VALUES (3, 'Mobile');

create table PatientPhone
(
  Id int identity(1, 1),
  PatientId int not null,
  Number nvarchar(50) not null,
  TypeId int not null default(0),
  IsPrimary bit not null default (0),  
  constraint PatientPhone_PK primary key (Id),
  constraint PatientPhone_Patient_FK foreign key (PatientId) references Patient(Id) on delete cascade,
  constraint PatientPhone_PhoneType_FK foreign key (TypeId) references PhoneType(Id) on delete set default,
);

CREATE TABLE PaymentType 
(
  Id int not null,
  Type varchar(10) not null,
  constraint PaymentType_PK primary key (Id)
);

insert into PaymentType (Id, [Type])
values (1, 'Каса');
insert into PaymentType (Id, [Type])
values (2, 'Платено');
insert into PaymentType (Id, [Type])
values (3, 'Фонд');

create table PaymentInfo
(
  Id int identity(1,1),
  FundId int null,
  FundCardNumber nvarchar(50) null,
  FundCardExpiration date null,
  constraint PaymentInfo_PK primary key (Id),
  constraint PaymentInfo_Fund_FK foreign key (FundId) references Fund(Id)
);

create table Reservation
(
  Id int identity(1, 1),
  PatientId int not null,
  DoctorId int not null,
  Date date not null,
  FromTime time not null,
  ToTime time not null,
  PaymentTypeId int not null,
  PaymentInfoId int null,
  Note nvarchar(max) null,
  CreatedBy int not null,
  constraint Reservation_PK primary key (Id),
  constraint Reservation_Patient_FK foreign key (PatientId) references Patient(Id),
  constraint Reservation_Doctor_FK foreign key (DoctorId) references Doctor(Id),
  constraint Reservation_PaymentType_FK foreign key (PaymentTypeId) references PaymentType(Id),
  constraint Reservation_PaymentInfo_FK foreign key (PaymentInfoId) references PaymentInfo(Id),
  constraint Reservation_User_FK foreign key (CreatedBy) references [User](Id)
);

create table [User] 
(
  Id int identity(1,1),
  UserName nvarchar(100) not null,
  Password varchar(max) not null,
  Salt varchar(max) not null,
  FirstName nvarchar(100) not null,
  LastName nvarchar(100) not null,
  Email nvarchar(100) not null,
  constraint User_PK primary key (Id)
);

create table Role 
(
  Id int identity(1,1),
  Name varchar(100) not null
  constraint Role_PK primary key (Id)
);

insert into [Role] ([Name])
values ('Администратор');

insert into [Role] ([Name])
values ('Регистратура');

create table RoleUser
(
  UserId int,
  RoleId int,
  constraint RoleUser_PK primary key (UserId, RoleId),
  constraint RoleUser_User_FK foreign key (UserId) references [User](Id),
  constraint RoleUser_Role_FK foreign key (RoleId) references Role(Id)
);


create table ReservationLock
(
  Id int identity(1,1),
  UserId int not null,
  DoctorId int not null,
  LockTime datetime default(GETDATE()) not null,
  [Date] date not null,
  FromTime time not null,
  ToTime time not null,
  constraint ReservationLock_PK primary key (Id),
  constraint ReservationLock_User_Fk foreign key (UserId) references [User](Id),
  constraint ReservationLock_Doctor_Fk foreign key (UserId) references Doctor(Id)
);

create table ReservationLog
(
  Id int identity(1,1),
  UserId int not null,
  LogTime datetime default(GETDATE()) not null,
  OperationType int not null,
  DoctorId int not null,
  [Date] date not null,
  FromTime time not null,
  ToTime time not null,
  constraint ReservationLog_PK primary key (Id),
  constraint ReservationLog_User_Fk foreign key (UserId) references [User](Id),
  constraint ReservationLog_Doctor_Fk foreign key (UserId) references Doctor(Id)
);