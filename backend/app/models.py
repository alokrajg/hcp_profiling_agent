from typing import List, Optional
from pydantic import BaseModel, Field, EmailStr


class SocialHandles(BaseModel):
	# Keep keys aligned with frontend expectations
	twitter: Optional[str] = None
	linkedin: Optional[str] = None


class Followers(BaseModel):
	twitter: Optional[str] = None
	linkedin: Optional[str] = None


class HCPProfile(BaseModel):
	id: str
	fullName: str
	specialty: str
	affiliation: str
	location: str
	degrees: str
	socialMediaHandles: SocialHandles = Field(default_factory=SocialHandles)
	followers: Followers = Field(default_factory=Followers)
	topInterests: List[str] = Field(default_factory=list)
	recentActivity: str = ""
	publications: int = 0
	engagementStyle: str = ""
	confidence: int = 80
	summary: str = ""


class BatchProfileRequest(BaseModel):
	npi_list: List[str] = Field(..., min_items=1)
	max_results_per_source: int = 5


class EmailDispatchRequest(BaseModel):
	to: List[EmailStr]
	subject: str
	html: str
