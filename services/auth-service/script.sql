/*Insert roles*/
INSERT INTO tbl_roles (role_name, role_description, is_active)
VALUES ('mechanic', 'mechanic role', true),
       ('regional_manager', 'regional manager role', true),
       ('call_centre_executive', 'call centre executive role', true),
       ('marketing_manager', 'marketing manager role', true),
       ('operator', 'operator role', true),
       ('viewer', 'viewer role', true);

/*User code function*/

CREATE OR REPLACE FUNCTION public.set_user_code()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF
AS $BODY$
BEGIN
  NEW.user_code := 'ZFP' || LPAD(NEW.user_role::text, 2, '0') || LPAD(NEW.user_id::text, 5, '0');
  RETURN NEW;
END;
$BODY$;
ALTER FUNCTION public.set_user_code()
    OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.set_user_code() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_user_code() TO postgres;
 
CREATE TRIGGER trg_set_user_code
 
BEFORE INSERT
 
ON public.tbl_users
 
FOR EACH ROW
 
EXECUTE FUNCTION public.set_user_code();

/*Insert into user table*/

INSERT INTO tbl_users (
  user_name,
  display_name,
  user_email,
  user_password,
  user_mobile,
  user_role,
  block_status
)
VALUES (
  'unknown',
  'unknown',
  'lohith.gm@scfpe.tech',
  '$2a$09$YclnNqsEFm9UesSm9pn0X.9e7ZVm1fk5aNgmq3niARn77Sh.lfyAq',
  '8088183747',
  1,
  'digilocker'
);

/*Insert into mechanic table*/

INSERT INTO tbl_mechanics(user_id) values(1);

/*Insert bank account details*/

INSERT INTO tbl_bank_details (
  user_id,
  account_number,
  account_ifsc,
  account_type,
  bank_name,
  bank_branch,
  account_holder_name,
  upi_id,
  cheque_url,
  is_active,
  upi_flag,
  bank_flag
)
VALUES (
  1,
  '123456789012',
  'SBIN0001234',
  'Savings',
  'State Bank of India',
  'MG Road Branch',
  'Lohith GM',
  'lohithgm@okicici',
  'https://example.com/uploads/cheque_lohith.png',
  true,
  true,
  true
);


insert into tbl_categories (category_id, category_name, category_description, is_active,category_short_code)
values
('1','MARUTI SUZUKI','MARUTI SUZUKI',true,'MS'),
('2','Hyundai','Hyundai',true,'HN'),
('3','MAHINDRA','MAHINDRA',true,'MH'),
('4','TOYOTA','TOYOTA',true,'TY'),
('5','HONDA','HONDA',true,'HD'),
('6','VW / SKODA','VW / SKODA',true,'VS'),
('7','MITSUBISHI','MITSUBISHI',true,'MT'),
('8','FORD','FORD',true,'FD'),
('9','RENAULT / NISSAN','RENAULT / NISSAN',true,'RN'),
('10','CHEVROLET','CHEVROLET',true,'CV'),
('11','FIAT','FIAT',true,'FT'),
('12','TATA','TATA',true,'TA');


insert into tbl_sub_categories(sub_category_id, category_id, sub_category_name, sub_category_description, is_active)
values
('1','1','ALTO 800 / ALTO K10','ALTO 800 / ALTO K10',true),
('2','1','SWIFT/DZIRE (1ST GEN)','SWIFT/DZIRE (1ST GEN)',true),
('3','1','SWIFT/DZIRE (2ND GEN)','SWIFT/DZIRE (2ND GEN)',true),
('4','1','SWIFT/DZIRE (3RD GEN)','SWIFT/DZIRE (3RD GEN)',true),
('5','1','EECO TYPE3 (ABS)','EECO TYPE3 (ABS)',true),
('6','1','ERTIGA 1ST GEN','ERTIGA 1ST GEN',true),
('7','1','ERTIGA (2ND GEN)','ERTIGA (2ND GEN)',true),
('8','1','WAGON-R (OLD) (1ST GEN)','WAGON-R (OLD) (1ST GEN)',true),
('9','1','WAGON-R 2ND GEN','WAGON-R 2ND GEN',true),
('10','1','WAGON-R 3RD GEN','WAGON-R 3RD GEN',true),
('11','1','BALENO (2015-2019)','BALENO (2015-2019)',true),
('12','1','CELERIO 1ST GEN','CELERIO 1ST GEN',true),
('13','1','CIAZ 1ST GEN','CIAZ 1ST GEN',true),
('14','12','Tiago/Tigor','Tiago/Tigor',true),
('15','12','ZEST / BOLT','ZEST / BOLT',true),
('16','12','NEXON','NEXON',true),
('17','2','GRAND I10 / XCENT','GRAND I10 / XCENT',true),
('18','2','ELITE I20','ELITE I20',true),
('19','2','I20 F/L','I20 F/L',true),
('20','2','VERNA FLUIDIC 4TH GEN','VERNA FLUIDIC 4TH GEN',true),
('21','2','OLD VERNA 3RD GEN','OLD VERNA 3RD GEN',true),
('22','2','GETZ PRIME','GETZ PRIME',true),
('23','2','OLD ELANTRA','OLD ELANTRA',true),
('24','3','XUV 500','XUV 500',true),
('25','4','INNOVA 1ST & 2ND GEN','INNOVA 1ST & 2ND GEN',true),
('26','4','INNOVA CRYSTA','INNOVA CRYSTA',true),
('27','4','FORTUNER TYPE 2','FORTUNER TYPE 2',true),
('28','4','COROLLA ALTIS (E140)','COROLLA ALTIS (E140)',true),
('29','4','OLD COROLLA (E120)','OLD COROLLA (E120)',true),
('30','4','ETIOS / LIVA','ETIOS / LIVA',true),
('31','4','OLD CAMRY (ACV/XV 30)','OLD CAMRY (ACV/XV 30)',true),
('32','4','CAMRY (ACV/XV 40)','CAMRY (ACV/XV 40)',true),
('33','5','AMAZE (1ST GEN)','AMAZE (1ST GEN)',true),
('34','5','AMAZE (2ND GEN)','AMAZE (2ND GEN)',true),
('35','5','CITY 5TH GEN','CITY 5TH GEN',true),
('36','5','CITY 6TH GEN','CITY 6TH GEN',true),
('37','5','CITY TYPE 1& 2 (SX-8)','CITY TYPE 1& 2 (SX-8)',true),
('38','5','OLD CITY 3RD GEN','OLD CITY 3RD GEN',true),
('39','5','CITY 4TH GEN','CITY 4TH GEN',true),
('40','5','OLD CIVIC','OLD CIVIC',true),
('41','5','ACCORD 7TH GEN','ACCORD 7TH GEN',true),
('42','6','POLO / VENTO / RAPID / AMEO','POLO / VENTO / RAPID / AMEO',true),
('43','6','FABIA','FABIA',true),
('44','6','OCTAVIA','OCTAVIA',true),
('45','6','LAURA','LAURA',true),
('46','7','PAJERO','PAJERO',true),
('47','8','ENDEAVOR 1ST / 2ND GEN','ENDEAVOR 1ST / 2ND GEN',true),
('48','8','IKON','IKON',true),
('49','8','OLD FIESTA','OLD FIESTA',true),
('50','9','MICRA / PULSE','MICRA / PULSE',true),
('51','9','X-TRAIL T31','X-TRAIL T31',true),
('52','10','OPTRA','OPTRA',true),
('53','10','AVEO','AVEO',true),
('54','10','CRUZE','CRUZE',true),
('55','11','PUNTO / LINEA','PUNTO / LINEA',true),
('56','7','LANCER','LANCER',true);


insert into tbl_sku_masters (sku_id, sku_name, sku_code, sku_description, category_id, points, product_value, sub_category_id, is_active)
values
('1','STRUT-FRONT-RH','JGM7003SR','STRUT-FRONT-RH','1','55','1751','1','true'),
('2','STRUT-FRONT-LH','JGM7003SL','STRUT-FRONT-LH','1','55','1751','1','true'),
('3','STRUT ASSEMBLY-FRONT, RH','JGM7005SR','STRUT ASSEMBLY-FRONT, RH','1','85','2881','1','true'),
('4','STRUT ASSEMBLY-FRONT, LH','JGM7005SL','STRUT ASSEMBLY-FRONT, LH','1','85','2881','1','true'),
('5','STRUT-FRONT-RH','JGM7011SR','STRUT-FRONT-RH','1','55','1818','2','true'),
('6','STRUT-FRONT-LH','JGM7011SL','STRUT-FRONT-LH','1','55','1818','2','true'),
('7','STRUT ASSEMBLY-FRONT, RH','JGM7013SR','STRUT ASSEMBLY-FRONT, RH','1','105','3459','2','true'),
('8','STRUT ASSEMBLY-FRONT, LH','JGM7013SL','STRUT ASSEMBLY-FRONT, LH','1','105','3459','2','true'),
('9','REAR SHOCK-REAR-RH/LH','JGT7008S','REAR SHOCK-REAR-RH/LH','1','45','1545','2','true'),
('10','STRUT-FRONT-RH','JGM7015SR','STRUT-FRONT-RH','1','75','2424','3','true'),
('11','STRUT-FRONT-LH','JGM7015SL','STRUT-FRONT-LH','1','75','2424','3','true'),
('12','STRUT ASSEMBLY-FRONT, RH','JGM7017SR','STRUT ASSEMBLY-FRONT, RH','1','115','3851','3','true'),
('13','STRUT ASSEMBLY-FRONT, LH','JGM7017SL','STRUT ASSEMBLY-FRONT, LH','1','115','3851','3','true'),
('14','REAR SHOCK-REAR-RH/LH','JGT7010S','REAR SHOCK-REAR-RH/LH','1','45','1545','3','true'),
('15','STRUT-FRONT-RH','JGM7051SR','STRUT-FRONT-RH','1','55','1847','4','true'),
('16','STRUT-FRONT-LH','JGM7051SL','STRUT-FRONT-LH','1','55','1847','4','true'),
('17','STRUT ASSEMBLY-FRONT, RH','JGM7055SR','STRUT ASSEMBLY-FRONT, RH','1','120','3938','4','true'),
('18','STRUT ASSEMBLY-FRONT, LH','JGM7055SL','STRUT ASSEMBLY-FRONT, LH','1','120','3938','4','true'),
('19','REAR SHOCK-REAR-RH/LH','JGT7028S','REAR SHOCK-REAR-RH/LH','1','60','1932','4','true'),
('20','STRUT FRONT-RH','JGM7080SR','STRUT FRONT-RH','1','60','1945','5','true'),
('21','STRUT FRONT-LH','JGM7080SL','STRUT FRONT-LH','1','60','1945','5','true'),
('22','STRUT ASSY FRONT-RH','JGM7081SR','STRUT ASSY FRONT-RH','1','90','3001','5','true'),
('23','STRUT ASSY FRONT-LH','JGM7081SL','STRUT ASSY FRONT-LH','1','90','3001','5','true'),
('24','STRUT-FRONT-RH','JGM7007SR','STRUT-FRONT-RH','1','75','2424','6','true'),
('25','STRUT-FRONT-LH','JGM7007SL','STRUT-FRONT-LH','1','75','2424','6','true'),
('26','STRUT ASSEMBLY-FRONT, RH','JGM7009SR','STRUT ASSEMBLY-FRONT, RH','1','120','4002','6','true'),
('27','STRUT ASSEMBLY-FRONT, LH','JGM7009SL','STRUT ASSEMBLY-FRONT, LH','1','120','4002','6','true'),
('28','REAR SHOCK-REAR-RH/LH','JGT7006S','REAR SHOCK-REAR-RH/LH','1','60','1957','6','true'),
('29','STRUT-FRONT-RH','JGM7045SR','STRUT-FRONT-RH','1','70','2279','7','true'),
('30','STRUT-FRONT-LH','JGM7045SL','STRUT-FRONT-LH','1','70','2279','7','true'),
('31','STRUT ASSEMBLY-FRONT, RH','JGM7047SR','STRUT ASSEMBLY-FRONT, RH','1','125','4087','7','true'),
('32','STRUT ASSEMBLY-FRONT, LH','JGM7047SL','STRUT ASSEMBLY-FRONT, LH','1','125','4087','7','true'),
('33','REAR SHOCK-REAR-RH/LH','JGT7026S','REAR SHOCK-REAR-RH/LH','1','65','2105','7','true'),
('34','STRUT-FRONT-RH','JGM7019SR','STRUT-FRONT-RH','1','55','1818','8','true'),
('35','STRUT-FRONT-LH','JGM7019SL','STRUT-FRONT-LH','1','55','1818','8','true'),
('36','STRUT ASSEMBLY-FRONT-RH','JGM7021SR','STRUT ASSEMBLY-FRONT-RH','1','80','2635','8','true'),
('37','STRUT ASSEMBLY-FRONT, LH','JGM7021SL','STRUT ASSEMBLY-FRONT, LH','1','80','2635','8','true'),
('38','STRUT-FRONT-RH','JGM7023SR','STRUT-FRONT-RH','1','45','1573','9','true'),
('39','STRUT-FRONT-LH','JGM7023SL','STRUT-FRONT-LH','1','45','1573','9','true'),
('40','STRUT ASSEMBLY-FRONT-RH','JGM7025SR','STRUT ASSEMBLY-FRONT-RH','1','80','2651','9','true'),
('41','STRUT ASSEMBLY-FRONT, LH','JGM7025SL','STRUT ASSEMBLY-FRONT, LH','1','80','2651','9','true'),
('42','FRONT STRUT, RH','JGM7093SR','FRONT STRUT, RH','1','50','1745','10','true'),
('43','FRONT STRUT, LH','JGM7093SL','FRONT STRUT, LH','1','50','1745','10','true'),
('44','STRUT ASSEMBLY-FRONT-RH','JGM7096SR','STRUT ASSEMBLY-FRONT-RH','1','110','3629','10','true'),
('45','STRUT ASSEMBLY-FRONT, LH','JGM7096SL','STRUT ASSEMBLY-FRONT, LH','1','110','3629','10','true'),
('46','WAGONR (YCA) RR','JGT7098S','WAGONR (YCA) RR','1','60','2005','10','true'),
('47','STRUT-FRONT-RH','JGM7033SR','STRUT-FRONT-RH','1','60','1959','11','true'),
('48','STRUT-FRONT-LH','JGM7033SL','STRUT-FRONT-LH','1','60','1959','11','true'),
('49','STRUT ASSEMBLY-FRONT-RH','JGM7035SR','STRUT ASSEMBLY-FRONT-RH','1','115','3791','11','true'),
('50','STRUT ASSEMBLY-FRONT, LH','JGM7035SL','STRUT ASSEMBLY-FRONT, LH','1','115','3791','11','true'),
('51','REAR SHOCK-REAR-RH/LH','JGT7022S','REAR SHOCK-REAR-RH/LH','1','70','2410','11','true'),
('52','STRUT-FRONT-RH','JGM7031SR','STRUT-FRONT-RH','1','65','2222','12','true'),
('53','STRUT-FRONT-LH','JGM7031SL','STRUT-FRONT-LH','1','65','2222','12','true'),
('54','STRUT ASSEMBLY-FRONT, RH','JGM7077SR','STRUT ASSEMBLY-FRONT, RH','1','110','3629','12','true'),
('55','STRUT ASSEMBLY-FRONT, LH','JGM7077SL','STRUT ASSEMBLY-FRONT, LH','1','110','3629','12','true'),
('56','REAR SHOCK-REAR-RH/LH','JGT7020S','REAR SHOCK-REAR-RH/LH','1','55','1872','12','true'),
('57','STRUT-FRONT-RH','JGM7039SR','STRUT-FRONT-RH','1','70','2264','13','true'),
('58','STRUT-FRONT-LH','JGM7039SL','STRUT-FRONT-LH','1','70','2264','13','true'),
('59','STRUT ASSEMBLY-FRONT, RH','JGM7043SR','STRUT ASSEMBLY-FRONT, RH','1','120','3924','13','true'),
('60','STRUT ASSEMBLY-FRONT, LH','JGM7043SL','STRUT ASSEMBLY-FRONT, LH','1','120','3924','13','true'),
('61','REAR SHOCK-REAR-RH/LH','JGT7024S','REAR SHOCK-REAR-RH/LH','1','60','2006','13','true'),
('62','SHOCK-REAR','JGT7103S','SHOCK-REAR','12','60','2021','14','true'),
('63','REAR SHOCK ABSORBER','JGT7105S','REAR SHOCK ABSORBER','12','45','1543','15','true'),
('64','REAR SHOCK ABSORBER (ASSEMBLY)','JGT7109S','REAR SHOCK ABSORBER (ASSEMBLY)','12','70','2404','15','true'),
('65','FR SHOCK ABSORBER - RH','JGM7100SR','FR SHOCK ABSORBER - RH','12','75','2538','15','true'),
('66','FR SHOCK ABSORBER - LH','JGM7100SL','FR SHOCK ABSORBER - LH','12','75','2538','15','true'),
('67','REAR SHOCK ABSORBER','JGT7104S','REAR SHOCK ABSORBER','12','65','2139','16','true'),
('68','SHOCK ABSORBER NEXON FRONT-LH','JGM7102SL','SHOCK ABSORBER NEXON FRONT-LH','12','75','2558','16','true'),
('69','SHOCK ABSORBER NEXON FRONT-RH','JGM7102SR','SHOCK ABSORBER NEXON FRONT-RH','12','75','2558','16','true'),
('70','SHOCK ABSORBER XCENT FRONT-RH','JGM7106SR','SHOCK ABSORBER XCENT FRONT-RH','2','50','1720','17','true'),
('71','SHOCK ABSORBER XCENT FRONT-LH','JGM7106SL','SHOCK ABSORBER XCENT FRONT-LH','2','50','1720','17','true'),
('72','STRUT FRONT-RH','JGM7092SR','STRUT FRONT-RH','2','60','1939','18','true'),
('73','STRUT FRONT-LH','JGM7092SL','STRUT FRONT-LH','2','60','1939','18','true'),
('74','SHOCK-REAR','JGT7093S','SHOCK-REAR','2','50','1613','18','true'),
('75','STRUT FRONT-RH','JGM7094SR','STRUT FRONT-RH','2','60','1963','19','true'),
('76','STRUT FRONT-LH','JGM7094SL','STRUT FRONT-LH','2','60','1963','19','true'),
('77','STRUT-FRONT-RH','JGM7091SR','STRUT-FRONT-RH','2','65','2090','20','true'),
('78','STRUT-FRONT-LH','JGM7091SL','STRUT-FRONT-LH','2','65','2090','20','true'),
('79','STRUT-REAR-RH/LH,SINGLE','JGT9000S','STRUT-REAR-RH/LH,SINGLE','2','75','2435','21','true'),
('80','STRUT-FRONT-LH','JGM9567SL','STRUT-FRONT-LH','2','120','3994','22','true'),
('81','STRUT-FRONT-RH','JGM9567SR','STRUT-FRONT-RH','2','120','3994','22','true'),
('82','STRUT-REAR,SINGLE','JGT9804S','STRUT-REAR,SINGLE','2','70','2408','22','true'),
('83','STRUT-FRONT-LH','JGM9287SL','STRUT-FRONT-LH','2','110','3611','23','true'),
('84','STRUT-FRONT-RH','JGM9287SR','STRUT-FRONT-RH','2','110','3611','23','true'),
('85','STRUT-REAR-LH','JGM9289SL','STRUT-REAR-LH','2','115','3894','23','true'),
('86','STRUT-REAR-RH','JGM9289SR','STRUT-REAR-RH','2','115','3894','23','true'),
('87','STRUT-FRONT-LH','JGM9219SL','STRUT-FRONT-LH','3','135','4550','24','true'),
('88','STRUT-FRONT-RH','JGM9219SR','STRUT-FRONT-RH','3','135','4550','24','true'),
('89','STRUT-REAR, SINGLE','JGT9101S','STRUT-REAR, SINGLE','3','80','2656','24','true'),
('90','STRUT-FRONT-RH','JGM7087SR','STRUT-FRONT-RH','4','55','1800','25','true'),
('91','STRUT-FRONT-LH','JGM7087SL','STRUT-FRONT-LH','4','55','1800','25','true'),
('92','STRUT-ASSY FRONT-RH','JGM7088SR','STRUT-ASSY FRONT-RH','4','135','4550','25','true'),
('93','STRUT-ASSY FRONT-LH','JGM7088SL','STRUT-ASSY FRONT-LH','4','135','4550','25','true'),
('94','SHOCK-REAR','JGT9171S','SHOCK-REAR','4','40','1404','25','true'),
('95','STRUT-FRONT-RH','JGM7095SR','STRUT-FRONT-RH','4','55','1838','26','true'),
('96','STRUT-FRONT-LH','JGM7095SL','STRUT-FRONT-LH','4','55','1838','26','true'),
('97','STRUT-ASSY FRONT-RH','JGM7090SR','STRUT-ASSY FRONT-RH','4','125','4087','26','true'),
('98','STRUT-ASSY FRONT-LH','JGM7090SL','STRUT-ASSY FRONT-LH','4','125','4087','26','true'),
('99','STRUT-FRONT-RH/LH','JGS9137S','STRUT-FRONT-RH/LH','4','85','2809','27','true'),
('100','STRUT-REAR','JGT9288S','STRUT-REAR','4','70','2335','27','true'),
('101','STRUT-FRONT-LH','JGM9015SL','STRUT-FRONT-LH','4','105','3565','28','true'),
('102','STRUT-FRONT-RH','JGM9015SR','STRUT-FRONT-RH','4','105','3565','28','true'),
('103','STRUT-REAR,SINGLE','JGS9012S','STRUT-REAR,SINGLE','4','75','2559','28','true'),
('104','STRUT-FRONT-LH','JGM9006SL','STRUT-FRONT-LH','4','100','3370','29','true'),
('105','STRUT-FRONT-RH','JGM9006SR','STRUT-FRONT-RH','4','100','3370','29','true'),
('106','STRUT-REAR,SINGLE','JGT9055S','STRUT-REAR,SINGLE','4','70','2391','29','true'),
('107','STRUT FRONT - RH/LH','JGM7082S','STRUT FRONT - RH/LH','4','65','2197','30','true'),
('108','STRUT ASSY- FRONT - RH/LH','JGM7083S','STRUT ASSY- FRONT - RH/LH','4','135','4494','30','true'),
('109','SHOCKS-REAR','JGT7084S','SHOCKS-REAR','4','40','1387','30','true'),
('110','STRUT-REAR,LH','JGM9845SL','STRUT-REAR,LH','4','145','4897','31','true'),
('111','STRUT-REAR-RH','JGM9845SR','STRUT-REAR-RH','4','145','4897','31','true'),
('112','STRUT-FRONT-LH','JGM9889SL','STRUT-FRONT-LH','4','145','4897','32','true'),
('113','STRUT-FRONT-RH','JGM9889SR','STRUT-FRONT-RH','4','145','4897','32','true'),
('114','STRUT-REAR,LH','JGM9867SL','STRUT-REAR,LH','4','145','4897','32','true'),
('115','STRUT-REAR-RH','JGM9867SR','STRUT-REAR-RH','4','145','4897','32','true'),
('116','STRUT-FRONT-RH','JGM7061SR','STRUT-FRONT-RH','5','55','1908','33','true'),
('117','STRUT-FRONT-LH','JGM7061SL','STRUT-FRONT-LH','5','55','1908','33','true'),
('118','REAR SHOCK-REAR-RH/LH','JGT7032S','REAR SHOCK-REAR-RH/LH','5','50','1702','33','true'),
('119','STRUT ASSEMBLY-FRONT-RH','JGM7079SR','STRUT ASSEMBLY-FRONT-RH','5','115','3876','33','true'),
('120','STRUT ASSEMBLY-FRONT-LH','JGM7079SL','STRUT ASSEMBLY-FRONT-LH','5','115','3876','33','true'),
('121','STRUT-FRONT-RH','JGM7097SR','STRUT-FRONT-RH','5','60','1959','34','true'),
('122','STRUT-FRONT-LH','JGM7097SL','STRUT-FRONT-LH','5','60','1959','34','true'),
('123','REAR SHOCK-REAR-RH/LH','JGT7099S','REAR SHOCK-REAR-RH/LH','5','50','1702','34','true'),
('124','STRUT-FRONT-RH','JGM7069SR','STRUT-FRONT-RH','5','65','2226','35','true'),
('125','STRUT-FRONT-LH','JGM7069SL','STRUT-FRONT-LH','5','65','2226','35','true'),
('126','STRUT ASSEMBLY-FRONT-RH','JGM7067SR','STRUT ASSEMBLY-FRONT-RH','5','115','3831','35','true'),
('127','STRUT ASSEMBLY-FRONT-LH','JGM7067SL','STRUT ASSEMBLY-FRONT-LH','5','115','3831','35','true'),
('128','REAR STRUT-REAR-RH/LH','JGT7036S','REAR STRUT-REAR-RH/LH','5','60','1941','35','true'),
('129','SHOCK ABSORBER -REAR','JGT9078S','SHOCK ABSORBER -REAR','5','80','2587','35','true'),
('130','STRUT-FRONT-RH','JGM7071SR','STRUT-FRONT-RH','5','70','2264','36','true'),
('131','STRUT-FRONT-LH','JGM7071SL','STRUT-FRONT-LH','5','70','2264','36','true'),
('132','REAR STRUT-REAR-RH/LH','JGT7038S','REAR STRUT-REAR-RH/LH','5','55','1896','36','true'),
('133','SHOCK ABSORBER SUITABLE- FRONT RH (GASTYPE)','JGS9901SR','SHOCK ABSORBER SUITABLE- FRONT RH (GASTYPE)','5','100','3403','37','true'),
('134','SHOCK ABSORBER SUITABLE FRONT LH (GASTYPE)','JGS9901SL','SHOCK ABSORBER SUITABLE FRONT LH (GASTYPE)','5','100','3292','37','true'),
('135','SHOCK ABSORBER SUITABLE REAR RH (GASTYPE)','JGM9903SL','SHOCK ABSORBER SUITABLE REAR RH (GASTYPE)','5','100','3268','37','true'),
('136','SHOCK ABSORBER SUITABLE REAR LH (GASTYPE)','JGM9903SR','SHOCK ABSORBER SUITABLE REAR LH (GASTYPE)','5','100','3268','37','true'),
('137','STRUT-FRONT-LH','JGM9745SL','STRUT-FRONT-LH','5','85','2771','38','true'),
('138','STRUT-FRONT-RH','JGM9745SR','STRUT-FRONT-RH','5','85','2771','38','true'),
('139','STRUT-REAR-RH/LH-SIGLE','JGT9160S','STRUT-REAR-RH/LH-SIGLE','5','65','2123','38','true'),
('140','STRUT-FRONT-LH','JGM9001SL','STRUT-FRONT-LH','5','90','2938','39','true'),
('141','STRUT-FRONT-RH','JGM9001SR','STRUT-FRONT-RH','5','90','2938','39','true'),
('142','STRUT-FRONT-RH','JGM9945SR','STRUT-FRONT-RH','5','115','3916','40','true'),
('143','STRUT-FRONT-LH','JGM9945SL','STRUT-FRONT-LH','5','115','3916','40','true'),
('144','STRUT-REAR-RH/LH-PAIR','JGT9173S','STRUT-REAR-RH/LH-PAIR','5','70','2250','40','true'),
('145','STRUT-FRONT-RH/LH-PAIR','JGS9046S','STRUT-FRONT-RH/LH-PAIR','5','110','3613','41','true'),
('146','STRUT-FRONT-RH/LH-SINGLE','JGM9005S','STRUT-FRONT-RH/LH-SINGLE','6','95','3192','42','true'),
('147','POLO - SHOCKS - REAR','JGT7086S','POLO - SHOCKS - REAR','6','55','1763','42','true'),
('148','VENTO - SHOCKS - REAR','JGT7096S','VENTO - SHOCKS - REAR','6','60','1936','42','true'),
('149','RAPID-SHOCKS-REAR','JGT7095S','RAPID-SHOCKS-REAR','6','55','1780','42','true'),
('150','STRUT-FRONT-RH/LH-SINGLE','JGM136S','STRUT-FRONT-RH/LH-SINGLE','6','120','4018','43','true'),
('151','STRUT-REAR-RH/LH-SINGLE','JGT9159S','STRUT-REAR-RH/LH-SINGLE','6','70','2344','43','true'),
('152','STRUT-FRONT-RH/LH-SINGLE','JGM9302S','STRUT-FRONT-RH/LH-SINGLE','6','100','3343','44','true'),
('153','STRUT-REAR-RH/LH-SINGLE','JGT9155S','STRUT-REAR-RH/LH-SINGLE','6','80','2673','44','true'),
('154','STRUT-FRONT-RH/LH-SINGLE','JGS9100S','STRUT-FRONT-RH/LH-SINGLE','6','115','3864','45','true'),
('155','STRUT-REAR-RH/LH-SINGLE','JGT9003S','STRUT-REAR-RH/LH-SINGLE','6','100','3301','45','true'),
('156','STRUT-FRONT-RH/LH-SINGLE','JGE9001S','STRUT-FRONT-RH/LH-SINGLE','7','55','1810','46','true'),
('157','STRUT-REAR-RH/LH-SINGLE','JGE9000S','STRUT-REAR-RH/LH-SINGLE','7','75','2547','46','true'),
('158','STRUT-FRONT-RH/LH-SINGLE','JGT9012S','STRUT-FRONT-RH/LH-SINGLE','8','80','2669','47','true'),
('159','STRUT-REAR-RH/LH-SINGLE','JGT9013S','STRUT-REAR-RH/LH-SINGLE','8','95','3134','47','true'),
('160','STRUT-FRONT-LH-SINGLE','JGS9801SL','STRUT-FRONT-LH-SINGLE','8','95','3143','48','true'),
('161','STRUT-FRONT-RH-SINGLE Sr','JGS9801SR','STRUT-FRONT-RH-SINGLE Sr','8','95','3143','48','true'),
('162','STRUT-REAR-RH/LH-SINGLE','JGS9803S','STRUT-REAR-RH/LH-SINGLE','8','90','3019','48','true'),
('163','SHOCK ABSORBER SUITABLE FOR (FORD FIESTA) - FRONT LH (GASTYPE)','JGM9820SL','SHOCK ABSORBER SUITABLE FOR (FORD FIESTA) - FRONT LH (GASTYPE)','8','85','2889','49','true'),
('164','SHOCK ABSORBER SUITABLE FOR (FORD FIESTA) - FRONT RH (GASTYPE)','JGM9820SR','SHOCK ABSORBER SUITABLE FOR (FORD FIESTA) - FRONT RH (GASTYPE)','8','85','2889','49','true'),
('165','STRUT-REAR-RH/LH-SINGLE','JGT9803S','STRUT-REAR-RH/LH-SINGLE','8','50','1634','49','true'),
('166','STRUT-FRONT-LH-SINGLE','JGM9002SL','STRUT-FRONT-LH-SINGLE','9','95','3094','50','true'),
('167','STRUT-FRONT-RH-SINGLE','JGM9002SR','STRUT-FRONT-RH-SINGLE','9','95','3094','50','true'),
('168','STRUT-REAR-RH/LH-SINGLE','JGT9017S','STRUT-REAR-RH/LH-SINGLE','9','55','1821','50','true'),
('169','SHOCK ABSORBER SUITABLE FOR (NISSAN MICRA) REAR L/R','JGT9034S','SHOCK ABSORBER SUITABLE FOR (NISSAN MICRA) REAR L/R','9','60','2038','50','true'),
('170','STRUT-FRONT-RH/LH-PAIR','JGM1185T','STRUT-FRONT-RH/LH-PAIR','9','330','11053','51','true'),
('171','STRUT-REAR-RH/LH-PAIR','JGM1183T','STRUT-REAR-RH/LH-PAIR','9','295','9764','51','true'),
('172','STRUT-FRONT-LH-SINGLE','JGM9412SL','STRUT-FRONT-LH-SINGLE','10','110','3637','52','true'),
('173','STRUT-FRONT-RH-SINGLE','JGM9412SR','STRUT-FRONT-RH-SINGLE','10','110','3637','52','true'),
('174','STRUT-REAR,LH-SINGLE','JGM9478SL','STRUT-REAR,LH-SINGLE','10','85','2901','52','true'),
('175','STRUT-REAR-RH-SINGLE','JGM9478SR','STRUT-REAR-RH-SINGLE','10','85','2901','52','true'),
('176','STRUT-FRONT-LH-SINGLE','JGM9490SL','STRUT-FRONT-LH-SINGLE','10','85','2796','53','true'),
('177','STRUT-FRONT-RH-SINGLE','JGM9490SR','STRUT-FRONT-RH-SINGLE','10','85','2796','53','true'),
('178','STRUT-REAR-RH/LH-SINGLE','JGT9805S','STRUT-REAR-RH/LH-SINGLE','10','50','1680','53','true'),
('179','STRUT-FRONT-LH-SINGLE','JGM9114SL','STRUT-FRONT-LH-SINGLE','10','160','5267','54','true'),
('180','STRUT-FRONT-RH-SINGLE','JGM9114SR','STRUT-FRONT-RH-SINGLE','10','160','5267','54','true'),
('181','STRUT-REAR-RH/LH-SINGLE','JGT9077S','STRUT-REAR-RH/LH-SINGLE','10','100','3274','54','true'),
('182','STRUT-FRONT-LH-SINGLE','JGM9191SL','STRUT-FRONT-LH-SINGLE','11','105','3526','55','true'),
('183','STRUT-FRONT-RH-SINGLE','JGM9191SR','STRUT-FRONT-RH-SINGLE','11','105','3526','55','true'),
('184','STRUT-REAR-RH/LH-SINGLE','JGT9113S','STRUT-REAR-RH/LH-SINGLE','11','65','2115','55','true'),
('185','SHOCK ABSORBER SUITABLE FOR (MITSUBISHI LANCER) - REAR L/R (GASTYPE)','JGS9091S','SHOCK ABSORBER SUITABLE FOR (MITSUBISHI LANCER) - REAR L/R (GASTYPE)','7','85','2907','56','true'),
('186','SHOCK ABSORBER SUITABLE FOR (MITSUBISHI LANCER) - FRONT L (GASTYPE)','JGM9623SL','SHOCK ABSORBER SUITABLE FOR (MITSUBISHI LANCER) - FRONT L (GASTYPE)','7','115','3889','56','true'),
('187','SHOCK ABSORBER SUITABLE FOR (MITSUBISHI LANCER) - FRONT R (GASTYPE)','JGM9623SR','SHOCK ABSORBER SUITABLE FOR (MITSUBISHI LANCER) - FRONT R (GASTYPE)','7','115','3889','56','true');


insert into tbl_ticket_categories (ticket_category, ticket_description)
values
('Loyalty points','Loyalty points'),
('App Performance','App Performance'),
('Profile Management','Profile Management'),
('Rewards and Benefits','Rewards and Benefits'),
('Account Access','Account Access'),
('Transactions','Transactions'),
('Communication','Communication'),
('Technical Support','Technical Support');

-- FUNCTION: public.insert_inventory_batch(text, text, integer, integer, text[])

-- DROP FUNCTION IF EXISTS public.insert_inventory_batch(text, text, integer, integer, text[]);

CREATE OR REPLACE FUNCTION public.insert_inventory_batch(
	_sku_code text,
	_quantity integer,
	_created_by integer,
	_serial_numbers text[])
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
	DECLARE
		new_batch_id INTEGER;
		serial TEXT;
	BEGIN
		INSERT INTO tbl_inventory_batch(sku_code,quantity,created_by) 
		VALUES (_sku_code,_quantity,_created_by)
		RETURNING batch_id into new_batch_id;
 
		FOREACH serial IN ARRAY _serial_numbers
			LOOP
				INSERT INTO tbl_inventory(serial_number,batch_id,is_active)
				VALUES (serial,new_batch_id,true);
			END LOOP;
		RETURN new_batch_id;
END
$BODY$;


-- market place sample data
insert into tbl_amazon_market_products 
(amazon_category, amazon_category_url, amazon_sub_category, amazon_sub_category_url, amazon_asin_sku, 
amazon_product_url, amazon_product_name, amazon_model_no, amazon_product_description, amazon_mrp, 
amazon_inventory_count, amazon_csp_price, amazon_discounted_price, amazon_points, amazon_diff, amazon_url, 
amazon_comments_vendor, created_by, updated_by) values 
('Electronics','electronics.png','Mobiles','mobiles.png','SKU001','electronics_mobiles_01.png','Product 01','MDL001','Lorem ipsum',1000,10,950,900,100,50,NULL,'Vendor',1,1),
('Electronics','electronics.png','Headphones','headphones.png','SKU002','electronics_headphones_01.png','Product 02','MDL002','Lorem ipsum',1200,12,1150,1100,120,50,NULL,'Vendor',1,1),
('Cameras','electronics.png','DSLR','dslr.png','SKU003','dslr_01.png','Product 03','MDL003','Lorem ipsum',900,15,850,800,90,50,NULL,'Vendor',1,1);


update tbl_amazon_market_products set amazon_category_url = 'electronics.png';
update tbl_amazon_market_products set amazon_category_url = 'cameras.png' where product_id = 5;

update tbl_amazon_market_products set amazon_sub_category_url = 'mobiles.png';
update tbl_amazon_market_products set amazon_sub_category_url = 'headphones.png' where product_id = 3;

update tbl_amazon_market_products set amazon_product_url = 'electronics_mobiles_01.png';
update tbl_amazon_market_products set amazon_product_url = 'electronics_mobiles_02.png' where product_id = 2;


insert into tbl_point_configurations (config_type,points) 
values
('Registration', '100'),
('Referrer', '100'),
('Referee', '100'),
('Point-Conversion', '1'),
('TDS-threshold', '20000');


INSERT INTO tbl_users (
    user_name,
    user_code,
    user_email,
    display_name,
    user_password,
    user_mobile,
    user_role,
    last_login_at,
    last_logout_at,
    fcm_token,
    block_status,
    created_at,
    created_by,
    updated_at,
    updated_by,
    pin_hash
) VALUES
(
'Sachin Barage',
'ZFP0200004',
'Sachin.Barage@ZF.com',
'Sachin Barage',
'$2a$09$SKbr8Z7YX0/m.3Rsop9.DuRNowqT/.6ziyKE.nDsgevowpMwzoAqu',
'9638527411',
2,
'2026-02-18 05:32:22.571+00',
'2026-01-29 10:40:41.964+00',
NULL,
'none',
'2025-12-08 08:17:36.533268+00',
NULL,
'2026-01-29 10:40:41.964+00',
NULL,
NULL
),
(
'Sanjay Singh',
'ZFP0200005',
'sanjay.singh2@zf.com',
'Sanjay Singh',
'$2a$09$SKbr8Z7YX0/m.3Rsop9.DuRNowqT/.6ziyKE.nDsgevowpMwzoAqu',
'9638527410',
2,
'2026-01-29 09:50:05.768+00',
'2026-01-29 09:50:10.97+00',
'cH-4lpGpRyaIFjVKsqqxNK:APA91bGaQn9mzwlfCH5RnbCKxR-0P1Smx-wm91GYHqveorNWr5JMSaiRLWyGKYz9JZzFOoSlMFAxGcVDZB184qhPiEZOM-4i7583frPDbpxYptiR5hTv0LY',
'none',
'2025-12-08 08:17:36.533268+00',
NULL,
'2026-01-29 09:50:10.97+00',
NULL,
NULL
),
(
'Kartik Deo',
'ZFP0400006',
'kartik.deo@gmail.com',
'Kartik Deo',
'$2a$09$SKbr8Z7YX0/m.3Rsop9.DuRNowqT/.6ziyKE.nDsgevowpMwzoAqu',
'9638527413',
4,
'2026-02-17 07:15:22.65+00',
'2026-02-02 11:27:18.161+00',
'cH-4lpGpRyaIFjVKsqqxNK:APA91bGaQn9mzwlfCH5RnbCKxR-0P1Smx-wm91GYHqveorNWr5JMSaiRLWyGKYz9JZzFOoSlMFAxGcVDZB184qhPiEZOM-4i7583frPDbpxYptiR5hTv0LY',
'none',
'2025-12-08 08:17:36.533268+00',
NULL,
'2026-02-16 07:31:06.421+00',
NULL,
'$2a$09$UHH/sRl6KFFApTwh36jiE.aTN1tUppkuHIGWlWdE4lAxIOXw8WSlq'
),
(
'Ranjeet Kulkarni',
'ZFP0200003',
'ranjeet.kulkarni@zf.com',
'Ranjeet Kulkarni',
'$2a$09$SKbr8Z7YX0/m.3Rsop9.DuRNowqT/.6ziyKE.nDsgevowpMwzoAqu',
'9638527412',
2,
'2026-02-18 06:52:06.633+00',
'2026-01-29 09:50:32.217+00',
NULL,
'none',
'2025-12-08 08:17:36.533268+00',
NULL,
'2026-01-29 09:50:32.217+00',
NULL,
NULL
);
