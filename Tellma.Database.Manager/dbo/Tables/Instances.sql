﻿CREATE TABLE [dbo].[Instances]
(
	[Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
	[LastHeartbeat] DATETIMEOFFSET NOT NULL
)
