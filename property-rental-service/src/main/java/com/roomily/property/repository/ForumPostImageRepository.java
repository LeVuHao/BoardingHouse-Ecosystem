package com.roomily.property.repository;

import com.roomily.property.entity.ForumPostImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ForumPostImageRepository extends JpaRepository<ForumPostImage, Long> {
}
