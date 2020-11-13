﻿CREATE FUNCTION [bll].[fn_DATEADD_GC]
(
	@Time1 DATETIME2, 
	@Months INT
)
RETURNS DATETIME2
AS
BEGIN
	DECLARE @Time2 DATETIME2;
	DECLARE @Year1 INT = YEAR(@Time1);
	DECLARE @EOGY DATETIME2 = DATEFROMPARTS(@Year1, 9, 6)
	
	SET @Time2 = DATEADD(DAY, 30 * @Months, @Time1);
	DECLARE @IsLeap BIT = 
		CASE
			WHEN @Year1 % 400 = 0 THEN 1
			WHEN @Year1 % 100 = 0 THEN 0
			WHEN @Year1 % 4 = 0 THEN 1
			ELSE 0
		END
	IF @Time1 <= @EOGY AND @Time2 > @EOGY
		SET @Time2 = DATEADD(DAY, 6 - @IsLeap, @Time2); 
	
	RETURN @Time2
END;