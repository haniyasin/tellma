﻿CREATE FUNCTION [dbo].[fn_DB_Name__Country]()
RETURNS NCHAR(2)
AS
BEGIN
	DECLARE @Hundreds SMALLINT = CAST(RIGHT(DB_NAME(),3) as SMALLINT) / 100;
	RETURN CASE
		WHEN @Hundreds = 0 THEN N'SA' -- for Master
		WHEN @Hundreds = 1 THEN N'SD'
		WHEN @Hundreds = 2 THEN N'ET'
		WHEN @Hundreds = 3 THEN N'SA'
		WHEN @Hundreds = 4 THEN N'LB'
		ELSE N'US'
	END
END